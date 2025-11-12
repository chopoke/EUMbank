package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 자산 분석 전체 응답 DTO
 * AssetAnalysis.js에서 사용할 모든 데이터를 포함
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetAnalysisResponse {
    private AssetGoalDto goal;
    private AssetDistributionDto distribution;
    private AssetDeltaSummaryDto deltaSummary;
    private UpcomingSpendingSummaryDto nextMonthSpending;
    private List<MonthlyTrendDto> monthlyTrends;
}

