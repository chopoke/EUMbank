package com.boot.eumbank.management.assetanalysis.repository;

import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.select.entity.QTransferHistory;
import com.boot.eumbank.foreign.entity.QForeignExchange;
import com.boot.eumbank.loan.entity.QLoan;
import com.boot.eumbank.loan.entity.QLoanSchedule;
import com.boot.eumbank.management.assetanalysis.dto.AssetDistributionDto;
import com.boot.eumbank.management.assetanalysis.dto.MonthlyTrendDto;
import com.boot.eumbank.management.assetanalysis.dto.WeeklyDeltaDto;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;


/**
 * 자산 분석 QueryDSL 구현 Repository
 * 복잡한 통계 쿼리를 QueryDSL로 처리
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class AssetAnalysisRepositoryImpl implements AssetAnalysisRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    private final QAccount account = QAccount.account;
    private final QTransferHistory transferHistory = QTransferHistory.transferHistory;
    private final QForeignExchange foreignExchange = QForeignExchange.foreignExchange;
    private final QLoan loan = QLoan.loan;
    private final QLoanSchedule loanSchedule = QLoanSchedule.loanSchedule;

    @Override
    public BigDecimal calculateCurrentNetWorth(Integer customerNo) {
        log.debug("순자산 계산 시작: customerNo={}", customerNo);
        
        // 1. 원화 계좌 잔액 합계
        BigDecimal krwBalance = queryFactory
                .select(account.balance.sum())
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.currency.eq("KRW"))
                                .and(account.status.eq("ACTIVE"))
                                .and(account.balance.isNotNull())
                )
                .fetchOne();

        if (krwBalance == null) {
            krwBalance = BigDecimal.ZERO;
        }
        
        log.debug("원화 계좌 잔액: {}", krwBalance);

        // 2. 외화 자산 원화 환산액 합계 (매수는 +, 매도는 -)
        // 매수(BUY)는 자산에 포함, 매도(SELL)는 차감
        // ForeignExchange 테이블에서 매도 시 음수로 저장되지 않으므로 별도 처리 필요
        BigDecimal buyAmount = queryFactory
                .select(foreignExchange.feAmtKrw.sum())
                .from(foreignExchange)
                .where(
                        foreignExchange.cNo.eq(customerNo)
                                .and(foreignExchange.feStatus.eq("COMPLETED"))
                                .and(foreignExchange.feSide.eq("BUY"))
                )
                .fetchOne();

        BigDecimal sellAmount = queryFactory
                .select(foreignExchange.feAmtKrw.sum())
                .from(foreignExchange)
                .where(
                        foreignExchange.cNo.eq(customerNo)
                                .and(foreignExchange.feStatus.eq("COMPLETED"))
                                .and(foreignExchange.feSide.eq("SELL"))
                )
                .fetchOne();

        BigDecimal netForeign = BigDecimal.ZERO;
        if (buyAmount != null) netForeign = netForeign.add(buyAmount);
        if (sellAmount != null) netForeign = netForeign.subtract(sellAmount);

        // 3. 대출 잔액 계산 (차감해야 함)
        BigDecimal loanBalance = calculateOutstandingLoanBalance(customerNo);
        log.debug("대출 잔액: {}", loanBalance);

        // 순자산 = 원화 잔액 + 외화 자산 - 대출 잔액
        BigDecimal totalNetWorth = krwBalance.add(netForeign).subtract(loanBalance).setScale(0, RoundingMode.DOWN);
        log.debug("최종 순자산: {} (원화: {}, 외화: {}, 대출: {})", totalNetWorth, krwBalance, netForeign, loanBalance);
        
        return totalNetWorth;
    }

    @Override
    public AssetDistributionDto getAssetDistribution(Integer customerNo) {
        log.debug("자산 배분 계산 시작: customerNo={}", customerNo);
        
        // 1. 현금성 자산 (DEMAND 계좌)
        BigDecimal cashBalance = queryFactory
                .select(account.balance.sum())
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.accountType.eq("DEMAND"))
                                .and(account.currency.eq("KRW"))
                                .and(account.status.eq("ACTIVE"))
                                .and(account.balance.isNotNull())
                )
                .fetchOne();
        
        log.debug("현금성 자산: {}", cashBalance);

        // 2. 적금/예금 자산
        BigDecimal depositBalance = queryFactory
                .select(account.balance.sum())
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.accountType.in("DEPOSIT", "INSTALLMENT"))
                                .and(account.currency.eq("KRW"))
                                .and(account.status.eq("ACTIVE"))
                                .and(account.balance.isNotNull())
                )
                .fetchOne();

        // 3. 외화 자산 (현재는 합산, 매도 처리 필요)
        BigDecimal buyAmount = queryFactory
                .select(foreignExchange.feAmtKrw.sum())
                .from(foreignExchange)
                .where(
                        foreignExchange.cNo.eq(customerNo)
                                .and(foreignExchange.feStatus.eq("COMPLETED"))
                                .and(foreignExchange.feSide.eq("BUY"))
                )
                .fetchOne();

        BigDecimal sellAmount = queryFactory
                .select(foreignExchange.feAmtKrw.sum())
                .from(foreignExchange)
                .where(
                        foreignExchange.cNo.eq(customerNo)
                                .and(foreignExchange.feStatus.eq("COMPLETED"))
                                .and(foreignExchange.feSide.eq("SELL"))
                )
                .fetchOne();

        BigDecimal foreignBalance = BigDecimal.ZERO;
        if (buyAmount != null) foreignBalance = foreignBalance.add(buyAmount);
        if (sellAmount != null) foreignBalance = foreignBalance.subtract(sellAmount);

        // 4. 투자 자산 (현재는 0으로 설정, 추후 투자 테이블 추가 시 대체)
        BigDecimal investmentBalance = BigDecimal.ZERO;

        if (cashBalance == null) cashBalance = BigDecimal.ZERO;
        if (depositBalance == null) depositBalance = BigDecimal.ZERO;
        if (foreignBalance == null) foreignBalance = BigDecimal.ZERO;

        BigDecimal totalBalance = cashBalance.add(depositBalance)
                .add(investmentBalance)
                .add(foreignBalance);
        
        log.debug("자산 배분 계산 결과 - 현금: {}, 예금: {}, 투자: {}, 외화: {}, 합계: {}", 
                cashBalance, depositBalance, investmentBalance, foreignBalance, totalBalance);

        BigDecimal cashPct = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? cashBalance.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal depositPct = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? depositBalance.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal investmentPct = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? investmentBalance.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        BigDecimal foreignPct = totalBalance.compareTo(BigDecimal.ZERO) > 0
                ? foreignBalance.divide(totalBalance, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // 추천 메시지 생성
        String recommendation = generateRecommendation(cashPct, depositPct);

        return AssetDistributionDto.builder()
                .cashPercentage(cashPct.setScale(2, RoundingMode.HALF_UP))
                .depositPercentage(depositPct.setScale(2, RoundingMode.HALF_UP))
                .investmentPercentage(investmentPct.setScale(2, RoundingMode.HALF_UP))
                .foreignPercentage(foreignPct.setScale(2, RoundingMode.HALF_UP))
                .totalAmount(totalBalance.setScale(0, RoundingMode.DOWN))
                .recommendation(recommendation)
                .build();
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
                                .and(account.status.eq("ACTIVE"))
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
                                .and(account.status.eq("ACTIVE"))
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
                                .and(account.status.eq("ACTIVE"))
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
                                .and(account.status.eq("ACTIVE"))
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
                .income(incomeInMan)
                .expense(expenseInMan)
                .net(net)
                .build();
    }

    /**
     * 미상환 대출 잔액 계산
     * LoanSchedule 테이블에서 미상환 금액 합계 계산
     * 
     * @param customerNo 고객번호
     * @return 미상환 대출 잔액 (양수)
     */
    private BigDecimal calculateOutstandingLoanBalance(Integer customerNo) {
        log.debug("대출 잔액 계산 시작: customerNo={}", customerNo);
        
        // 1. 고객의 ACTIVE 상태 대출 번호들 조회
        List<Long> activeLoanNos = queryFactory
                .select(loan.loanNo)
                .from(loan)
                .where(
                        loan.customerNo.eq(customerNo)
                                .and(loan.status.eq("ACTIVE"))
                )
                .fetch();
        
        if (activeLoanNos.isEmpty()) {
            log.debug("대출 잔액: 0 (활성 대출 없음)");
            return BigDecimal.ZERO;
        }
        
        // 2. 각 대출의 미상환 스케줄에서 잔액 계산
        // 미상환 금액 = (duePrincipal + dueInterest) - (paidPrincipal + paidInterest)
        // 상태가 DUE, PARTIAL, OVERDUE인 것만 포함
        
        Tuple summary = queryFactory
                .select(
                        loanSchedule.duePrincipal.sum(),
                        loanSchedule.dueInterest.sum(),
                        loanSchedule.paidPrincipal.sum(),
                        loanSchedule.paidInterest.sum()
                )
                .from(loanSchedule)
                .where(
                        loanSchedule.loanNo.in(activeLoanNos)
                                .and(loanSchedule.status.in("DUE", "PARTIAL", "OVERDUE"))
                )
                .fetchOne();
        
        if (summary == null) {
            log.debug("대출 잔액: 0 (미상환 스케줄 없음)");
            return BigDecimal.ZERO;
        }
        
        BigDecimal duePrincipal = summary.get(loanSchedule.duePrincipal.sum()) != null
                ? summary.get(loanSchedule.duePrincipal.sum())
                : BigDecimal.ZERO;
        BigDecimal dueInterest = summary.get(loanSchedule.dueInterest.sum()) != null
                ? summary.get(loanSchedule.dueInterest.sum())
                : BigDecimal.ZERO;
        BigDecimal paidPrincipal = summary.get(loanSchedule.paidPrincipal.sum()) != null
                ? summary.get(loanSchedule.paidPrincipal.sum())
                : BigDecimal.ZERO;
        BigDecimal paidInterest = summary.get(loanSchedule.paidInterest.sum()) != null
                ? summary.get(loanSchedule.paidInterest.sum())
                : BigDecimal.ZERO;
        
        // 미상환 금액 = (원금 + 이자) - (상환된 원금 + 상환된 이자)
        BigDecimal totalOutstanding = (duePrincipal.add(dueInterest))
                .subtract(paidPrincipal.add(paidInterest));
        
        // 음수는 0으로 처리
        if (totalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            totalOutstanding = BigDecimal.ZERO;
        }
        
        log.debug("대출 잔액 계산 결과: {}", totalOutstanding);
        return totalOutstanding.setScale(0, RoundingMode.DOWN);
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

