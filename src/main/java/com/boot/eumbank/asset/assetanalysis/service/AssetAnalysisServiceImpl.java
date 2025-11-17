package com.boot.eumbank.asset.assetanalysis.service;

import com.boot.eumbank.asset.assetanalysis.dto.*;
import com.boot.eumbank.asset.assetanalysis.entity.AssetGoal;
import com.boot.eumbank.asset.assetanalysis.repository.AssetAnalysisRepositoryCustom;
import com.boot.eumbank.asset.assetanalysis.repository.AssetGoalRepository;
import com.boot.eumbank.asset.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 자산 분석 서비스 구현 클래스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssetAnalysisServiceImpl implements AssetAnalysisService {

    private final AssetAnalysisRepositoryCustom analysisRepository;
    private final AssetGoalRepository goalRepository;
    private final DashboardService dashboardService;

    private static final Map<String, String> EXECUTION_TYPE_LABELS = Map.ofEntries(
            Map.entry("AUTO", "자동이체"),
            Map.entry("UTILITY", "공과금 자동이체"),
            Map.entry("SUBSCRIPTION", "정기 구독 결제"),
            Map.entry("INSURANCE", "보험료 자동이체"),
            Map.entry("LOAN_INTEREST", "대출 이자 상환"),
            Map.entry("RENT", "임대료 자동이체"),
            Map.entry("EDUCATION", "교육비 자동이체"),
            Map.entry("COMMUNICATION", "통신비 자동이체"),
            Map.entry("CARD", "카드대금 자동이체")
    );

    @Override
    @Transactional(readOnly = true)
    public AssetAnalysisResponse getAssetAnalysis(Integer customerNo, String period, Integer count, String chartPeriod, Integer chartCount) {
        // 기본값 설정
        if (period == null || period.isEmpty()) {
            period = "WEEKLY";
        }
        if (count == null) {
            // 모든 기간에서 기본값 4로 통일
            count = 4;
        }
        
        // 최대값 제한 (카드 크기 고려)
        int maxCount = "DAILY".equals(period) ? 7 : 5; // 일별만 7일, 나머지는 5개
        if (count > maxCount) {
            count = maxCount;
        }
        
        log.info("자산 분석 시작: customerNo={}, period={}, count={}", customerNo, period, count);

        // 1. 목표 달성률 계산
        AssetGoalDto goalDto = calculateGoalAchievement(customerNo);

        // 2. 자산 배분 분석
        AssetDistributionDto distributionDto = analysisRepository.getAssetDistribution(customerNo);

        // 3. 자산 증감 상태 (period와 count에 따라)
        AssetDeltaSummaryDto deltaSummaryDto = calculateDeltaSummary(customerNo, period, count);

        // 4. 차트 변화 추이 (chartPeriod와 chartCount에 따라)
        if (chartPeriod == null || chartPeriod.isEmpty()) {
            chartPeriod = "MONTHLY";
        }
        if (chartCount == null) {
            chartCount = 4;
        }
        // 차트는 드래그/줌으로 탐색하므로 충분한 데이터를 가져옴
        int defaultChartCount = switch (chartPeriod) {
            case "MINUTELY" -> 1440; // 최대 24시간 (1440분)
            case "HOURLY" -> 720;    // 최대 30일 (720시간)
            case "DAILY" -> 365;     // 최대 1년 (365일)
            case "WEEKLY" -> 104;    // 최대 2년 (104주)
            case "MONTHLY" -> 24;    // 최대 2년 (24개월)
            default -> 12;
        };
        // chartCount가 지정되지 않았거나 너무 크면 기본값 사용
        if (chartCount == null || chartCount > defaultChartCount) {
            chartCount = defaultChartCount;
        }
        List<MonthlyTrendDto> monthlyTrends = analysisRepository.getTrendsByPeriod(customerNo, chartPeriod, chartCount);

        // 요청한 개수보다 많다면 최근 chartCount개만 유지
        if (monthlyTrends.size() > chartCount) {
            monthlyTrends = monthlyTrends.subList(monthlyTrends.size() - chartCount, monthlyTrends.size());
        }

        // 각 기간의 순자산 계산 (현재 순자산에서 역순으로 순변동 누적)
        // Dashboard에서 순자산 계산 로직을 가져옴
        BigDecimal currentNetWorth = dashboardService.getDashboardSummary(customerNo).netWorth();
        for (int i = monthlyTrends.size() - 1; i >= 0; i--) {
            MonthlyTrendDto trend = monthlyTrends.get(i);
            // 순변동을 원 단위로 변환 (만원 -> 원)
            BigDecimal netChange = trend.getNet() != null 
                ? trend.getNet().multiply(BigDecimal.valueOf(10000))
                : BigDecimal.ZERO;
            // 현재 순자산에서 순변동을 빼서 해당 기간 말 순자산 계산
            trend.setNetWorth(currentNetWorth);
            // 다음 기간을 위해 순변동 차감
            currentNetWorth = currentNetWorth.subtract(netChange);
        }

        UpcomingSpendingSummaryDto nextMonthSpendingSummary = buildNextMonthSpendingSummary(customerNo);

        return AssetAnalysisResponse.builder()
                .goal(goalDto)
                .distribution(distributionDto)
                .deltaSummary(deltaSummaryDto)
                .nextMonthSpending(nextMonthSpendingSummary)
                .monthlyTrends(monthlyTrends)
                .build();
    }

    /**
     * 목표 달성률 계산
     */
    private AssetGoalDto calculateGoalAchievement(Integer customerNo) {
        // 현재 순자산 계산 (Dashboard에서 가져옴)
        BigDecimal currentNetWorth = dashboardService.getDashboardSummary(customerNo).netWorth();

        // 목표 조회
        Optional<AssetGoal> goalOpt = goalRepository.findActiveGoalByCustomerNo(customerNo);
        
        BigDecimal targetAmount;
        AssetGoal goal;
        
        if (goalOpt.isPresent()) {
            goal = goalOpt.get();
            targetAmount = goal.getTargetAmount() != null
                    ? goal.getTargetAmount()
                    : BigDecimal.valueOf(100000000); // 기본 1억원
        } else {
            // 목표가 없으면 고정된 기본 목표 사용 (동적으로 생성하지 않음)
            targetAmount = BigDecimal.valueOf(100000000); // 1억원
            goal = null;
        }

        // 달성률 계산
        BigDecimal achievementRate = BigDecimal.ZERO;
        if (targetAmount.compareTo(BigDecimal.ZERO) > 0) {
            achievementRate = currentNetWorth
                    .divide(targetAmount, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }

        // 목표 가격이 현재보다 낮으면 100% 처리
        if (achievementRate.compareTo(BigDecimal.valueOf(100)) > 0) {
            achievementRate = BigDecimal.valueOf(100);
        }

        // 예상 달성 시점 계산 (간단한 추정)
        LocalDate expectedDate = calculateExpectedAchievementDate(
                currentNetWorth, targetAmount, achievementRate);

        return AssetGoalDto.builder()
                .currentNetWorth(currentNetWorth)
                .targetNetWorth(targetAmount)
                .achievementRate(achievementRate)
                .expectedAchievementDate(expectedDate)
                .achievementStatus(getAchievementStatus(achievementRate))
                .build();
    }

    private UpcomingSpendingSummaryDto buildNextMonthSpendingSummary(Integer customerNo) {
        LocalDate nextMonthStart = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        LocalDate nextMonthEnd = nextMonthStart.plusMonths(1).minusDays(1);

        List<NextMonthScheduledTransferDto> transfers = analysisRepository.findNextMonthScheduledTransfers(
                customerNo,
                nextMonthStart.atStartOfDay(),
                nextMonthEnd.atTime(LocalTime.MAX)
        );

        if (transfers.isEmpty()) {
            return UpcomingSpendingSummaryDto.builder()
                    .rangeStart(nextMonthStart)
                    .rangeEnd(nextMonthEnd)
                    .totalAmount(BigDecimal.ZERO)
                    .totalPaymentCount(0)
                    .items(List.of())
                    .build();
        }

        Map<String, SpendingAggregate> aggregates = new LinkedHashMap<>();

        for (NextMonthScheduledTransferDto transfer : transfers) {
            BigDecimal amount = transfer.getAmount() != null ? transfer.getAmount() : BigDecimal.ZERO;
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            String category = resolveUpcomingSpendingCategory(transfer);
            SpendingAggregate aggregate = aggregates.computeIfAbsent(category, key -> new SpendingAggregate());
            aggregate.addAmount(amount);
            aggregate.incrementCount();
            LocalDate scheduledDate = transfer.getScheduledAt() != null
                    ? transfer.getScheduledAt().toLocalDate()
                    : nextMonthStart;
            aggregate.updateFirstDate(scheduledDate);
            aggregate.updateMemoSample(chooseMemoSample(transfer));
        }

        if (aggregates.isEmpty()) {
            return UpcomingSpendingSummaryDto.builder()
                    .rangeStart(nextMonthStart)
                    .rangeEnd(nextMonthEnd)
                    .totalAmount(BigDecimal.ZERO)
                    .totalPaymentCount(0)
                    .items(List.of())
                    .build();
        }

        BigDecimal totalAmount = aggregates.values().stream()
                .map(SpendingAggregate::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return UpcomingSpendingSummaryDto.builder()
                    .rangeStart(nextMonthStart)
                    .rangeEnd(nextMonthEnd)
                    .totalAmount(BigDecimal.ZERO)
                    .totalPaymentCount(aggregates.values().stream().mapToInt(SpendingAggregate::count).sum())
                    .items(List.of())
                    .build();
        }

        List<UpcomingSpendingItemDto> items = aggregates.entrySet().stream()
                .sorted((left, right) -> right.getValue().amount().compareTo(left.getValue().amount()))
                .map(entry -> {
                    SpendingAggregate aggregate = entry.getValue();
                    BigDecimal amount = aggregate.amount().setScale(0, RoundingMode.DOWN);
                    BigDecimal percentage = aggregate.amount()
                            .divide(totalAmount, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(1, RoundingMode.HALF_UP);
                    return UpcomingSpendingItemDto.builder()
                            .category(entry.getKey())
                            .amount(amount)
                            .percentage(percentage)
                            .paymentCount(aggregate.count())
                            .firstScheduledDate(aggregate.firstDate())
                            .memoSample(aggregate.memoSample())
                            .build();
                })
                .toList();

        int totalCount = aggregates.values().stream().mapToInt(SpendingAggregate::count).sum();

        return UpcomingSpendingSummaryDto.builder()
                .rangeStart(nextMonthStart)
                .rangeEnd(nextMonthEnd)
                .totalAmount(totalAmount.setScale(0, RoundingMode.DOWN))
                .totalPaymentCount(totalCount)
                .items(items)
                .build();
    }

    private String resolveUpcomingSpendingCategory(NextMonthScheduledTransferDto transfer) {
        if (hasText(transfer.getExecutionType())) {
            String executionType = transfer.getExecutionType().trim().toUpperCase(Locale.ROOT);
            if (EXECUTION_TYPE_LABELS.containsKey(executionType)) {
                return EXECUTION_TYPE_LABELS.get(executionType);
            }
            return humanizeLabel(executionType);
        }
        if (hasText(transfer.getScheduleType())) {
            String scheduleType = transfer.getScheduleType().trim();
            if ("RECURRING".equalsIgnoreCase(scheduleType)) {
                return "정기 자동이체";
            }
            if ("ONCE".equalsIgnoreCase(scheduleType)) {
                return "예약 이체";
            }
            return humanizeLabel(scheduleType);
        }
        return "기타 예약 이체";
    }

    private String chooseMemoSample(NextMonthScheduledTransferDto transfer) {
        if (hasText(transfer.getMemo())) {
            return transfer.getMemo().trim();
        }
        if (hasText(transfer.getExecutionType())) {
            String label = humanizeLabel(transfer.getExecutionType());
            return label;
        }
        if (hasText(transfer.getScheduleType())) {
            return humanizeLabel(transfer.getScheduleType());
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String humanizeLabel(String raw) {
        if (!hasText(raw)) {
            return "기타";
        }
        String normalized = raw.trim().replace('_', ' ');
        String[] parts = normalized.toLowerCase(Locale.ROOT).split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) continue;
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(part.charAt(0)))
                    .append(part.substring(1));
        }
        return builder.length() > 0 ? builder.toString() : normalized;
    }

    private static final class SpendingAggregate {
        private BigDecimal amount = BigDecimal.ZERO;
        private int count;
        private LocalDate firstDate;
        private String memoSample;

        void addAmount(BigDecimal additional) {
            if (additional == null) {
                return;
            }
            amount = amount.add(additional);
        }

        void incrementCount() {
            count++;
        }

        void updateFirstDate(LocalDate candidate) {
            if (candidate == null) {
                return;
            }
            if (firstDate == null || candidate.isBefore(firstDate)) {
                firstDate = candidate;
            }
        }

        void updateMemoSample(String memo) {
            if (memo == null || memo.isBlank()) {
                return;
            }
            if (memoSample == null) {
                memoSample = memo.trim();
            }
        }

        BigDecimal amount() {
            return amount;
        }

        int count() {
            return count;
        }

        LocalDate firstDate() {
            return firstDate;
        }

        String memoSample() {
            return memoSample;
        }
    }

    /**
     * 예상 달성 시점 계산
     */
    private LocalDate calculateExpectedAchievementDate(
            BigDecimal current, BigDecimal target, BigDecimal currentRate) {

        if (currentRate.compareTo(BigDecimal.valueOf(100)) >= 0) {
            return LocalDate.now();
        }

        // 간단한 추정: 월 100만원 저축 가정
        BigDecimal remaining = target.subtract(current);
        BigDecimal monthlySaving = BigDecimal.valueOf(1000000);
        int monthsNeeded = remaining.divide(monthlySaving, 0, java.math.RoundingMode.UP)
                .intValue();

        return LocalDate.now().plusMonths(monthsNeeded);
    }

    /**
     * 달성 상태 메시지
     */
    private String getAchievementStatus(BigDecimal rate) {
        if (rate.compareTo(BigDecimal.valueOf(100)) >= 0) {
            return "목표 달성";
        } else if (rate.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return "목표에 근접";
        } else if (rate.compareTo(BigDecimal.valueOf(50)) >= 0) {
            return "진행 중";
        } else {
            return "시작 단계";
        }
    }

    /**
     * 자산 증감 요약 계산
     */
    private AssetDeltaSummaryDto calculateDeltaSummary(Integer customerNo, String period, int count) {
        // period에 따라 적절한 메서드 호출
        List<WeeklyDeltaDto> weeklyDeltas;
        switch (period) {
            case "DAILY":
                weeklyDeltas = analysisRepository.getDailyDeltas(customerNo, count);
                break;
            case "MONTHLY":
                weeklyDeltas = analysisRepository.getMonthlyDeltas(customerNo, count);
                break;
            case "WEEKLY":
            default:
                weeklyDeltas = analysisRepository.getWeeklyDeltas(customerNo, count);
                break;
        }

        // 30일간 총 증감 및 적금/투자 납입 합계 (고정)
        MonthlyTrendDto last30Days = analysisRepository.getLast30DaysSummary(customerNo);

        // 선택한 기간의 총 증감 계산 (천원 단위)
        BigDecimal totalDelta = weeklyDeltas.stream()
                .map(WeeklyDeltaDto::getDeltaAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 추세 설명
        String trendDescription = generateTrendDescription(totalDelta, weeklyDeltas);

        return AssetDeltaSummaryDto.builder()
                .weeklyDeltas(weeklyDeltas)
                .totalDelta30Days(totalDelta.multiply(BigDecimal.valueOf(1000))) // 천원 단위를 원 단위로 변환
                .trendDescription(trendDescription)
                .incomeTotal(last30Days.getIncome())
                .expenseTotal(last30Days.getExpense())
                .build();
    }

    /**
     * 추세 설명 생성
     */
    private String generateTrendDescription(BigDecimal totalDelta, List<WeeklyDeltaDto> weeklyDeltas) {
        if (totalDelta.compareTo(BigDecimal.ZERO) > 0) {
            return "급여 입금, 적금 납입이 증가 요인으로 분석됩니다.";
        } else if (totalDelta.compareTo(BigDecimal.ZERO) < 0) {
            return "지출이 수입보다 많아 자산이 감소했습니다.";
        } else {
            return "자산이 안정적으로 유지되고 있습니다.";
        }
    }

    /**
     * 자산 목표 설정 또는 수정
     */
    @Override
    @Transactional
    public AssetGoalDto setGoal(Integer customerNo, AssetGoalRequest request) {
        log.info("자산 목표 설정: customerNo={}, targetAmount={}, targetDate={}", 
                customerNo, request.getTargetAmount(), request.getTargetDate());

        // 현재 순자산 계산 (Dashboard에서 가져옴)
        BigDecimal currentNetWorth = dashboardService.getDashboardSummary(customerNo).netWorth();

        // 기존 활성 목표 조회
        Optional<AssetGoal> existingGoalOpt = goalRepository.findActiveGoalByCustomerNo(customerNo);

        AssetGoal goal;
        if (existingGoalOpt.isPresent()) {
            // 기존 목표가 있으면 수정
            goal = existingGoalOpt.get();
            goal.setTargetAmount(request.getTargetAmount());
            goal.setTargetDate(request.getTargetDate());
            goal.setUpdatedAt(java.time.LocalDateTime.now());
            log.info("기존 목표 수정: ag_no={}", goal.getId());
        } else {
            // 새로운 목표 생성
            goal = AssetGoal.builder()
                    .customerNo(customerNo)
                    .targetAmount(request.getTargetAmount())
                    .targetDate(request.getTargetDate())
                    .currentAmount(currentNetWorth)
                    .isActive("Y")
                    .build();
            log.info("새 목표 생성");
        }

        // 달성률 계산
        goal.calculateAchievementRate();

        // 저장
        goalRepository.save(goal);

        // 예상 달성 시점 계산
        LocalDate expectedDate = calculateExpectedAchievementDate(
                currentNetWorth, request.getTargetAmount(), goal.getAchievedRate());

        // DTO 생성 및 반환
        return AssetGoalDto.builder()
                .currentNetWorth(currentNetWorth)
                .targetNetWorth(request.getTargetAmount())
                .achievementRate(goal.getAchievedRate())
                .expectedAchievementDate(expectedDate)
                .achievementStatus(getAchievementStatus(goal.getAchievedRate()))
                .build();
    }
}


