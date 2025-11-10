package com.boot.eumbank.asset.assetanalysis.service;

import com.boot.eumbank.asset.assetanalysis.dto.*;
import com.boot.eumbank.asset.assetanalysis.entity.AssetGoal;
import com.boot.eumbank.asset.assetanalysis.repository.AssetAnalysisRepositoryCustom;
import com.boot.eumbank.asset.assetanalysis.repository.AssetGoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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
        BigDecimal currentNetWorth = analysisRepository.calculateCurrentNetWorth(customerNo);
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

        return AssetAnalysisResponse.builder()
                .goal(goalDto)
                .distribution(distributionDto)
                .deltaSummary(deltaSummaryDto)
                .monthlyTrends(monthlyTrends)
                .build();
    }

    /**
     * 목표 달성률 계산
     */
    private AssetGoalDto calculateGoalAchievement(Integer customerNo) {
        // 현재 순자산 계산
        BigDecimal currentNetWorth = analysisRepository.calculateCurrentNetWorth(customerNo);

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

        // 현재 순자산 계산
        BigDecimal currentNetWorth = analysisRepository.calculateCurrentNetWorth(customerNo);

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


