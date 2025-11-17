package com.boot.eumbank.asset.assetanalysis.repository;

import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.select.entity.QTransferHistory;
import com.boot.eumbank.asset.assetanalysis.dto.AssetDistributionDto;
import com.boot.eumbank.asset.assetanalysis.dto.MonthlyTrendDto;
import com.boot.eumbank.asset.assetanalysis.dto.NextMonthScheduledTransferDto;
import com.boot.eumbank.asset.assetanalysis.dto.WeeklyDeltaDto;
import com.boot.eumbank.asset.dashboard.repository.DashboardRepository;
import com.boot.eumbank.foreign.entity.ForeignRate;
import com.boot.eumbank.foreign.entity.QForeignRate;
import com.boot.eumbank.loan.entity.QLoan;
import com.boot.eumbank.spot.model.QGoldWallet;
import com.boot.eumbank.transfer_domain.transfer.entity.QTransferOrder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;


/**
 * 자산 분석 QueryDSL 구현 Repository
 * 복잡한 통계 쿼리를 QueryDSL로 처리
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class AssetAnalysisRepositoryImpl implements AssetAnalysisRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final DashboardRepository dashboardRepository;

    private final QAccount account = QAccount.account;
    private final QTransferHistory transferHistory = QTransferHistory.transferHistory;
    private final QForeignRate foreignRate = QForeignRate.foreignRate;
    private final QLoan loan = QLoan.loan;
    private final QGoldWallet goldWallet = QGoldWallet.goldWallet;
    private final QTransferOrder transferOrder = QTransferOrder.transferOrder;

    private static final Set<String> EXCLUDED_TRANSFER_TYPES = Set.of("FX_IN", "FX_OUT");
    private static final Set<String> INACTIVE_ACCOUNT_STATUSES = Set.of("CLOSED", "INACTIVE", "SUSPENDED", "DELETED");
    private static final Set<String> INACTIVE_LOAN_STATUSES = Set.of("CLOSED", "SETTLED", "CANCELLED");
    private static final Set<String> ACTIVE_TRANSFER_STATUSES = Set.of("SCHEDULED", "ACTIVE");

    /**
     * {@inheritDoc}
     * DashboardRepository의 계산 로직을 재사용하여 일관성 있는 순자산 계산을 수행한다.
     * Dashboard와 동일한 방식으로 입출금, 적금, 예금, 외화, 현물을 합산하고 대출을 차감한다.
     */
    @Override
    public BigDecimal calculateCurrentNetWorth(Integer customerNo) {
        log.debug("순자산 계산 시작: customerNo={}", customerNo);
        
        // DashboardRepository의 메서드를 재사용하여 일관성 유지
        BigDecimal cash = dashboardRepository.sumCash(customerNo);
        BigDecimal foreign = dashboardRepository.sumForeign(customerNo);
        BigDecimal installment = dashboardRepository.sumInstallment(customerNo);
        BigDecimal deposit = dashboardRepository.sumDeposit(customerNo);
        BigDecimal gold = dashboardRepository.sumGold(customerNo);
        BigDecimal totalLiabilities = dashboardRepository.sumLoan(customerNo);
        
        BigDecimal totalAssets = cash.add(foreign).add(installment).add(deposit).add(gold);
        BigDecimal totalNetWorth = totalAssets.subtract(totalLiabilities).setScale(0, RoundingMode.DOWN);
        
        log.debug("순자산 계산 완료: customerNo={}, 입출금={}, 외화={}, 적금={}, 예금={}, 현물={}, 대출={}, 순자산={}",
                customerNo, cash, foreign, installment, deposit, gold, totalLiabilities, totalNetWorth);
        return totalNetWorth;
    }


    /**
     * {@inheritDoc}
     * 외화 계좌는 최신 환율로 환산한 뒤 별도 비중으로 집계한다.
     */
    @Override
    public AssetDistributionDto getAssetDistribution(Integer customerNo) {
        log.debug("자산 배분 계산 시작: customerNo={}", customerNo);
        
        Map<AssetCategory, BigDecimal> categoryAmounts = new EnumMap<>(AssetCategory.class);
        Map<String, BigDecimal> rateCache = new HashMap<>();

        List<Tuple> accountSummaries = queryFactory
                .select(account.accountType, account.currency, account.balance.sum())
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.balance.isNotNull())
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                )
                .groupBy(account.accountType, account.currency)
                .fetch();

        for (Tuple summary : accountSummaries) {
            String accountType = summary.get(account.accountType);
            String currency = summary.get(account.currency);
            BigDecimal balance = summary.get(account.balance.sum());

            BigDecimal amountInKrw = convertToKrw(balance, currency, rateCache);
            AssetCategory category = resolveAssetCategory(accountType, currency);
            categoryAmounts.merge(category, amountInKrw, BigDecimal::add);
        }

        BigDecimal cashBalance = categoryAmounts.getOrDefault(AssetCategory.CASH, BigDecimal.ZERO);
        BigDecimal depositBalance = categoryAmounts.getOrDefault(AssetCategory.DEPOSIT, BigDecimal.ZERO);
        BigDecimal investmentBalance = categoryAmounts.getOrDefault(AssetCategory.INVESTMENT, BigDecimal.ZERO);
        BigDecimal foreignBalance = categoryAmounts.getOrDefault(AssetCategory.FOREIGN, BigDecimal.ZERO);

        BigDecimal totalBalance = cashBalance.add(depositBalance)
                .add(investmentBalance)
                .add(foreignBalance);
        
        BigDecimal cashPct = calculatePercentage(cashBalance, totalBalance);
        BigDecimal depositPct = calculatePercentage(depositBalance, totalBalance);
        BigDecimal investmentPct = calculatePercentage(investmentBalance, totalBalance);
        BigDecimal foreignPct = calculatePercentage(foreignBalance, totalBalance);

        log.debug("자산 배분 계산 결과 - 현금: {}, 예금: {}, 투자: {}, 외화(환산): {}, 합계: {}",
                cashBalance, depositBalance, investmentBalance, foreignBalance, totalBalance);

        String recommendation = generateRecommendation(cashPct, depositPct);

        return AssetDistributionDto.builder()
                .cashPercentage(cashPct)
                .depositPercentage(depositPct)
                .investmentPercentage(investmentPct)
                .foreignPercentage(foreignPct)
                .totalAmount(totalBalance.setScale(0, RoundingMode.DOWN))
                .recommendation(recommendation)
                .build();
    }

    @Override
    public List<NextMonthScheduledTransferDto> findNextMonthScheduledTransfers(Integer customerNo, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        if (customerNo == null || rangeStart == null || rangeEnd == null) {
            return List.of();
        }

        return queryFactory
                .select(
                        Projections.constructor(
                                NextMonthScheduledTransferDto.class,
                                transferOrder.to_amount,
                                transferOrder.to_start_at,
                                transferOrder.to_schedule_type,
                                transferOrder.to_execution_type,
                                transferOrder.to_memo
                        )
                )
                .from(transferOrder)
                .join(account).on(transferOrder.a_no.eq(account.aNo))
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                                .and(transferOrder.to_status.in(ACTIVE_TRANSFER_STATUSES))
                                .and(transferOrder.to_start_at.isNotNull())
                                .and(transferOrder.to_start_at.between(rangeStart, rangeEnd))
                )
                .fetch();
    }

    /**
     * 금액을 통화 코드에 맞춰 원화로 환산한다.
     *
     * @param amount     통화 금액
     * @param currency   통화 코드
     * @param rateCache  환율 캐시
     * @return 원화 환산 금액
     */
    private BigDecimal convertToKrw(BigDecimal amount, String currency, Map<String, BigDecimal> rateCache) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (currency == null || currency.isBlank() || "KRW".equalsIgnoreCase(currency)) {
            return amount;
        }
        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        BigDecimal rate = rateCache.computeIfAbsent(normalized, this::resolveLatestRate);
        if (rate == null) {
            log.warn("환율 정보 조회 실패: currency={}, amount={}", normalized, amount);
            return BigDecimal.ZERO;
        }
        return amount.multiply(rate);
    }

    /**
     * 통화 코드에 대한 최신 매매 기준율을 조회한다.
     *
     * @param currencyCode 통화 코드
     * @return 매매 기준율(1 단위 기준)
     */
    private BigDecimal resolveLatestRate(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return null;
        }
        String normalized = currencyCode.trim().toUpperCase(Locale.ROOT);
        BooleanExpression unitMatches = foreignRate.frCurUnit.upper().eq(normalized)
                .or(foreignRate.frCurUnit.upper().startsWith(normalized + "("));

        ForeignRate latestRate = queryFactory
                .selectFrom(foreignRate)
                .where(unitMatches)
                .orderBy(foreignRate.frObservedDate.desc(), foreignRate.frNo.desc())
                .fetchFirst();

        if (latestRate == null) {
            log.warn("환율 정보가 존재하지 않습니다: currency={}", normalized);
            return null;
        }

        return normalizeRatePerUnit(latestRate);
    }

    /**
     * 환율 단위를 1 단위 기준으로 정규화한다.
     *
     * @param rate 환율 엔티티
     * @return 1 단위 기준 환율
     */
    private BigDecimal normalizeRatePerUnit(ForeignRate rate) {
        if (rate.getFrDealBas() == null) {
            return null;
        }
        BigDecimal divisor = determineUnitDivisor(rate.getFrCurUnit());
        return rate.getFrDealBas().divide(divisor, 8, RoundingMode.HALF_UP);
    }

    /**
     * 환율 단위 문자열에서 분모를 추출한다. (예: JPY(100) → 100)
     *
     * @param unitString 환율 단위 문자열
     * @return 분모 값, 기본값 1
     */
    private BigDecimal determineUnitDivisor(String unitString) {
        if (unitString == null) {
            return BigDecimal.ONE;
        }
        int start = unitString.indexOf('(');
        int end = unitString.indexOf(')');
        if (start >= 0 && end > start) {
            String numeric = unitString.substring(start + 1, end).replaceAll("[^0-9.]", "");
            if (!numeric.isBlank()) {
                try {
                    BigDecimal parsed = new BigDecimal(numeric);
                    if (parsed.compareTo(BigDecimal.ZERO) > 0) {
                        return parsed;
                    }
                } catch (NumberFormatException ex) {
                    log.warn("환율 단위 파싱 실패: unit={}", unitString, ex);
                }
            }
        }
        return BigDecimal.ONE;
    }

    /**
     * 계좌 유형과 통화 정보를 기반으로 자산 배분 카테고리를 판별한다.
     *
     * @param accountType 계좌 유형
     * @param currency    통화 코드
     * @return 자산 배분 카테고리
     */
    private AssetCategory resolveAssetCategory(String accountType, String currency) {
        if (currency != null && !currency.isBlank() && !"KRW".equalsIgnoreCase(currency)) {
            return AssetCategory.FOREIGN;
        }
        String normalizedType = accountType != null
                ? accountType.trim().toLowerCase(Locale.ROOT)
                : "";

        if (normalizedType.isBlank()) {
            return AssetCategory.CASH;
        }
        if (normalizedType.contains("입출금")
                || normalizedType.contains("checking")
                || normalizedType.contains("demand")
                || normalizedType.contains("current")) {
            return AssetCategory.CASH;
        }
        if (normalizedType.contains("deposit")
                || normalizedType.contains("saving")
                || normalizedType.contains("installment")
                || normalizedType.contains("적금")
                || normalizedType.contains("예금")
                || normalizedType.contains("적립")) {
            return AssetCategory.DEPOSIT;
        }
        if (normalizedType.contains("투자")
                || normalizedType.contains("investment")
                || normalizedType.contains("펀드")
                || normalizedType.contains("fund")
                || normalizedType.contains("stock")
                || normalizedType.contains("증권")) {
            return AssetCategory.INVESTMENT;
        }
        return AssetCategory.DEPOSIT;
    }

    /**
     * 비중을 계산한다.
     *
     * @param amount 항목 금액
     * @param total  전체 금액
     * @return 전체 대비 비중(%) - 소수점 둘째 자리
     */
    private BigDecimal calculatePercentage(BigDecimal amount, BigDecimal total) {
        if (amount == null || total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amount.divide(total, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * 자산 배분 산출에 사용되는 카테고리.
     */
    private enum AssetCategory {
        CASH,
        DEPOSIT,
        INVESTMENT,
        FOREIGN
    }

    @Override
    public List<WeeklyDeltaDto> getWeeklyDeltas(Integer customerNo, int weeks) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        // 주차별 증감 계산
        // 각 주의 시작일과 종료일을 계산하여 주차별로 그룹핑
        List<WeeklyDeltaDto> result = new java.util.ArrayList<>();
        
        // 오래된 주부터 최근 주 순서로 리스트에 추가 (차트에서 왼쪽에서 오른쪽으로 시간 순서)
        for (int weekIndex = weeks - 1; weekIndex >= 0; weekIndex--) {
            // 각 주의 시작일과 종료일 계산
            // 주차는 역순으로 계산 (0주차 = 현재 주, 1주차 = 지난 주, ...)
            // 각 주는 월요일 00:00:00 ~ 일요일 23:59:59
            
            LocalDateTime weekEnd;
            LocalDateTime weekStart;
            
            if (weekIndex == 0) {
                // 현재 주: 이번 주 월요일 00:00부터 현재까지
                java.time.DayOfWeek currentDayOfWeek = now.getDayOfWeek();
                int daysFromMonday = currentDayOfWeek.getValue() - 1; // 월요일=0, 일요일=6
                weekStart = now.minusDays(daysFromMonday).withHour(0).withMinute(0).withSecond(0).withNano(0);
                weekEnd = now; // 현재 시각까지
            } else {
                // 과거 주: 해당 주의 월요일 00:00 ~ 일요일 23:59
                LocalDateTime targetWeekEnd = now.minusWeeks(weekIndex);
                java.time.DayOfWeek dayOfWeek = targetWeekEnd.getDayOfWeek();
                int daysFromMonday = dayOfWeek.getValue() - 1; // 월요일=0, 일요일=6
                weekStart = targetWeekEnd.minusDays(daysFromMonday).withHour(0).withMinute(0).withSecond(0).withNano(0);
                weekEnd = weekStart.plusDays(6).withHour(23).withMinute(59).withSecond(59);
            }

            // 해당 주의 입출금 합계 조회
            Tuple weekData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(weekStart, weekEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal in = weekData != null && weekData.get(transferHistory.accountIn.sum()) != null
                    ? weekData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal out = weekData != null && weekData.get(transferHistory.accountOut.sum()) != null
                    ? weekData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 증감액 계산 (천원 단위)
            BigDecimal delta = in.subtract(out).divide(BigDecimal.valueOf(1000), 0, RoundingMode.DOWN);
            // 역순으로 정렬했으므로 라벨도 역순으로 (가장 오래된 주가 1주)
            String weekLabel = String.format("%d주", weeks - weekIndex);

            result.add(WeeklyDeltaDto.builder()
                    .weekLabel(weekLabel)
                    .deltaAmount(delta)
                    .build());
        }

        return result;
    }

    @Override
    public List<WeeklyDeltaDto> getDailyDeltas(Integer customerNo, int days) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        List<WeeklyDeltaDto> result = new java.util.ArrayList<>();
        
        // 최근 날짜부터 역순으로 (오래된 날짜부터 최근 날짜 순서로 리스트에 추가)
        // 차트에서는 왼쪽에서 오른쪽으로 시간 순서대로 표시되므로 역순으로 정렬
        for (int dayIndex = days - 1; dayIndex >= 0; dayIndex--) {
            // 각 일의 시작일과 종료일 계산 (00:00:00 ~ 23:59:59)
            LocalDateTime dayStart = now.minusDays(dayIndex).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime dayEnd = now.minusDays(dayIndex).withHour(23).withMinute(59).withSecond(59);

            // 해당 일의 입출금 합계 조회
            Tuple dayData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(dayStart, dayEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal in = dayData != null && dayData.get(transferHistory.accountIn.sum()) != null
                    ? dayData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal out = dayData != null && dayData.get(transferHistory.accountOut.sum()) != null
                    ? dayData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 증감액 계산 (천원 단위)
            BigDecimal delta = in.subtract(out).divide(BigDecimal.valueOf(1000), 0, RoundingMode.DOWN);
            
            // 날짜 라벨 (예: "11/1", "11/2")
            String dayLabel = dayStart.format(java.time.format.DateTimeFormatter.ofPattern("M/d", Locale.KOREAN));

            result.add(WeeklyDeltaDto.builder()
                    .weekLabel(dayLabel)
                    .deltaAmount(delta)
                    .build());
        }

        return result;
    }

    @Override
    public List<WeeklyDeltaDto> getMonthlyDeltas(Integer customerNo, int months) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        List<WeeklyDeltaDto> result = new java.util.ArrayList<>();
        
        // 오래된 월부터 최근 월 순서로 리스트에 추가 (차트에서 왼쪽에서 오른쪽으로 시간 순서)
        for (int monthIndex = months - 1; monthIndex >= 0; monthIndex--) {
            // 각 월의 시작일과 종료일 계산
            LocalDateTime monthEnd;
            LocalDateTime monthStart;
            
            if (monthIndex == 0) {
                // 현재 월: 이번 달 1일 00:00부터 현재까지
                monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                monthEnd = now;
            } else {
                // 과거 월: 해당 월의 1일 00:00 ~ 마지막 날 23:59
                LocalDateTime targetMonth = now.minusMonths(monthIndex);
                monthStart = targetMonth.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                monthEnd = monthStart.plusMonths(1).minusDays(1).withHour(23).withMinute(59).withSecond(59);
            }

            // 해당 월의 입출금 합계 조회
            Tuple monthData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(monthStart, monthEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal in = monthData != null && monthData.get(transferHistory.accountIn.sum()) != null
                    ? monthData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal out = monthData != null && monthData.get(transferHistory.accountOut.sum()) != null
                    ? monthData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 증감액 계산 (천원 단위)
            BigDecimal delta = in.subtract(out).divide(BigDecimal.valueOf(1000), 0, RoundingMode.DOWN);
            
            // 월 라벨 (예: "10월", "9월")
            String monthLabel = monthStart.format(java.time.format.DateTimeFormatter.ofPattern("M월", Locale.KOREAN));

            result.add(WeeklyDeltaDto.builder()
                    .weekLabel(monthLabel)
                    .deltaAmount(delta)
                    .build());
        }

        return result;
    }

    @Override
    public List<WeeklyDeltaDto> getHourlyDeltas(Integer customerNo, int hours) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.isNull()
                                        .or(account.status.notIn(INACTIVE_ACCOUNT_STATUSES)))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        List<WeeklyDeltaDto> result = new java.util.ArrayList<>();
        
        // 오래된 시간부터 최근 시간 순서로 리스트에 추가
        for (int hourIndex = hours - 1; hourIndex >= 0; hourIndex--) {
            // 각 시간의 시작과 종료 계산 (00분 00초 ~ 59분 59초)
            LocalDateTime hourStart = now.minusHours(hourIndex).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime hourEnd = now.minusHours(hourIndex).withMinute(59).withSecond(59).withNano(999999999);

            // 해당 시간의 입출금 합계 조회
            Tuple hourData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(hourStart, hourEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal in = hourData != null && hourData.get(transferHistory.accountIn.sum()) != null
                    ? hourData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal out = hourData != null && hourData.get(transferHistory.accountOut.sum()) != null
                    ? hourData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 증감액 계산 (천원 단위)
            BigDecimal delta = in.subtract(out).divide(BigDecimal.valueOf(1000), 0, RoundingMode.DOWN);
            
            // 시간 라벨 (예: "14시", "15시")
            String hourLabel = hourStart.format(java.time.format.DateTimeFormatter.ofPattern("H시", Locale.KOREAN));

            result.add(WeeklyDeltaDto.builder()
                    .weekLabel(hourLabel)
                    .deltaAmount(delta)
                    .build());
        }

        return result;
    }

    @Override
    public List<WeeklyDeltaDto> getMinutelyDeltas(Integer customerNo, int minutes) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        List<WeeklyDeltaDto> result = new java.util.ArrayList<>();
        
        // 오래된 분부터 최근 분 순서로 리스트에 추가
        for (int minuteIndex = minutes - 1; minuteIndex >= 0; minuteIndex--) {
            // 각 분의 시작과 종료 계산 (00초 ~ 59초)
            LocalDateTime minuteStart = now.minusMinutes(minuteIndex).withSecond(0).withNano(0);
            LocalDateTime minuteEnd = now.minusMinutes(minuteIndex).withSecond(59).withNano(999999999);

            // 해당 분의 입출금 합계 조회
            Tuple minuteData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(minuteStart, minuteEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal in = minuteData != null && minuteData.get(transferHistory.accountIn.sum()) != null
                    ? minuteData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal out = minuteData != null && minuteData.get(transferHistory.accountOut.sum()) != null
                    ? minuteData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 증감액 계산 (천원 단위)
            BigDecimal delta = in.subtract(out).divide(BigDecimal.valueOf(1000), 0, RoundingMode.DOWN);
            
            // 분 라벨 (예: "14:30", "14:31")
            String minuteLabel = minuteStart.format(java.time.format.DateTimeFormatter.ofPattern("H:mm", Locale.KOREAN));

            result.add(WeeklyDeltaDto.builder()
                    .weekLabel(minuteLabel)
                    .deltaAmount(delta)
                    .build());
        }

        return result;
    }

    @Override
    public List<MonthlyTrendDto> getTrendsByPeriod(Integer customerNo, String period, int count) {
        LocalDateTime now = LocalDateTime.now();
        
        // 해당 고객의 모든 계좌번호 조회
        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return List.of();
        }

        List<MonthlyTrendDto> result = new java.util.ArrayList<>();
        
        // period에 따라 기간별로 이체 내역 집계
        for (int index = count - 1; index >= 0; index--) {
            LocalDateTime periodStart;
            LocalDateTime periodEnd;
            String periodLabel;
            
            switch (period) {
                case "MINUTELY":
                    periodStart = now.minusMinutes(index).withSecond(0).withNano(0);
                    periodEnd = now.minusMinutes(index).withSecond(59).withNano(999999999);
                    periodLabel = periodStart.format(java.time.format.DateTimeFormatter.ofPattern("H:mm", Locale.KOREAN));
                    break;
                case "HOURLY":
                    periodStart = now.minusHours(index).withMinute(0).withSecond(0).withNano(0);
                    periodEnd = now.minusHours(index).withMinute(59).withSecond(59).withNano(999999999);
                    periodLabel = periodStart.format(java.time.format.DateTimeFormatter.ofPattern("H시", Locale.KOREAN));
                    break;
                case "DAILY":
                    periodStart = now.minusDays(index).withHour(0).withMinute(0).withSecond(0).withNano(0);
                    periodEnd = now.minusDays(index).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
                    periodLabel = periodStart.format(java.time.format.DateTimeFormatter.ofPattern("M/d", Locale.KOREAN));
                    break;
                case "WEEKLY":
                    if (index == 0) {
                        java.time.DayOfWeek currentDayOfWeek = now.getDayOfWeek();
                        int daysFromMonday = currentDayOfWeek.getValue() - 1;
                        periodStart = now.minusDays(daysFromMonday).withHour(0).withMinute(0).withSecond(0).withNano(0);
                        periodEnd = now;
                    } else {
                        LocalDateTime targetWeekEnd = now.minusWeeks(index);
                        java.time.DayOfWeek dayOfWeek = targetWeekEnd.getDayOfWeek();
                        int daysFromMonday = dayOfWeek.getValue() - 1;
                        periodStart = targetWeekEnd.minusDays(daysFromMonday).withHour(0).withMinute(0).withSecond(0).withNano(0);
                        periodEnd = periodStart.plusDays(6).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
                    }
                    periodLabel = periodStart.format(java.time.format.DateTimeFormatter.ofPattern("M/d")) + "주";
                    break;
                case "MONTHLY":
                default:
                    if (index == 0) {
                        periodStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                        periodEnd = now;
                    } else {
                        LocalDateTime targetMonth = now.minusMonths(index);
                        periodStart = targetMonth.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                        periodEnd = periodStart.plusMonths(1).minusDays(1).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
                    }
                    periodLabel = periodStart.format(java.time.format.DateTimeFormatter.ofPattern("M월", Locale.KOREAN));
                    break;
            }

            // 해당 기간의 입금(수익)과 출금(소비) 집계
            Tuple periodData = queryFactory
                    .select(
                            transferHistory.accountIn.sum(),
                            transferHistory.accountOut.sum()
                    )
                    .from(transferHistory)
                    .where(
                            transferHistory.accountNo.in(accountNos)
                                    .and(transferHistory.transferAt.between(periodStart, periodEnd))
                                    .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                    )
                    .fetchOne();

            BigDecimal income = periodData != null && periodData.get(transferHistory.accountIn.sum()) != null
                    ? periodData.get(transferHistory.accountIn.sum())
                    : BigDecimal.ZERO;
            BigDecimal expense = periodData != null && periodData.get(transferHistory.accountOut.sum()) != null
                    ? periodData.get(transferHistory.accountOut.sum())
                    : BigDecimal.ZERO;

            // 만원 단위로 변환
            BigDecimal incomeInMan = income.divide(BigDecimal.valueOf(10000), 0, RoundingMode.DOWN);
            BigDecimal expenseInMan = expense.divide(BigDecimal.valueOf(10000), 0, RoundingMode.DOWN);
            BigDecimal net = incomeInMan.subtract(expenseInMan);

            result.add(MonthlyTrendDto.builder()
                    .month(periodLabel)
                    .periodStartDate(periodStart.toLocalDate().toString())
                    .income(incomeInMan)
                    .expense(expenseInMan)
                    .net(net)
                    .build());
        }

        return result;
    }

    @Override
    public List<MonthlyTrendDto> getMonthlyTrends(Integer customerNo, int months) {
        // getTrendsByPeriod를 사용하여 일관성 유지
        return getTrendsByPeriod(customerNo, "MONTHLY", months);
    }

    @Override
    public MonthlyTrendDto getLast30DaysSummary(Integer customerNo) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(30);

        List<Integer> accountNos = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();

        if (accountNos.isEmpty()) {
            return MonthlyTrendDto.builder()
                    .month("30일")
                    .periodStartDate(startDate.toLocalDate().toString())
                    .income(BigDecimal.ZERO)
                    .expense(BigDecimal.ZERO)
                    .net(BigDecimal.ZERO)
                    .build();
        }

        // 30일간 입금(수익)과 출금(소비) 집계
        Tuple summaryData = queryFactory
                .select(
                        transferHistory.accountIn.sum(),
                        transferHistory.accountOut.sum()
                )
                .from(transferHistory)
                .where(
                        transferHistory.accountNo.in(accountNos)
                                .and(transferHistory.transferAt.after(startDate))
                                .and(transferHistory.transferType.notIn(EXCLUDED_TRANSFER_TYPES))
                )
                .fetchOne();

        BigDecimal incomeTotal = summaryData != null && summaryData.get(transferHistory.accountIn.sum()) != null
                ? summaryData.get(transferHistory.accountIn.sum())
                : BigDecimal.ZERO;
        BigDecimal expenseTotal = summaryData != null && summaryData.get(transferHistory.accountOut.sum()) != null
                ? summaryData.get(transferHistory.accountOut.sum())
                : BigDecimal.ZERO;

        // 만원 단위로 변환
        BigDecimal incomeInMan = incomeTotal.divide(BigDecimal.valueOf(10000), 0, RoundingMode.DOWN);
        BigDecimal expenseInMan = expenseTotal.divide(BigDecimal.valueOf(10000), 0, RoundingMode.DOWN);
        BigDecimal net = incomeInMan.subtract(expenseInMan);

        return MonthlyTrendDto.builder()
                .month("30일")
                .periodStartDate(startDate.toLocalDate().toString())
                .income(incomeInMan)
                .expense(expenseInMan)
                .net(net)
                .build();
    }

    /**
     * 자산 배분에 따른 추천 메시지 생성
     */
    private String generateRecommendation(BigDecimal cashPct, BigDecimal depositPct) {
        if (cashPct.compareTo(BigDecimal.valueOf(40)) > 0) {
            return "현금성 자산 비중이 다소 높습니다. 중장기 목표가 있다면 적금 또는 투자 상품으로 일부 분산하는 것을 고려해 보세요.";
        } else if (depositPct.compareTo(BigDecimal.valueOf(50)) > 0) {
            return "예금 자산 비중이 높습니다. 목표 달성을 위해 일부 투자 상품을 고려해 볼 수 있습니다.";
        }
        return "자산 배분이 균형 잡혀 있습니다.";
    }
}

