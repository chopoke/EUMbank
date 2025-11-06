package com.boot.eumbank.management.assetanalysis.repository;

import com.boot.eumbank.management.assetanalysis.dto.AssetDistributionDto;
import com.boot.eumbank.management.assetanalysis.dto.MonthlyTrendDto;
import com.boot.eumbank.management.assetanalysis.dto.WeeklyDeltaDto;

import java.math.BigDecimal;
import java.util.List;

/**
 * 자산 분석 복잡 쿼리용 Custom Repository
 */
public interface AssetAnalysisRepositoryCustom {

    /**
     * 현재 순자산 계산 (현금 + 적금 + 외화 포함)
     */
    BigDecimal calculateCurrentNetWorth(Integer customerNo);

    /**
     * 자산 배분 분석 (현금, 적금, 투자, 외화 비중)
     */
    AssetDistributionDto getAssetDistribution(Integer customerNo);

    /**
     * 최근 N주간 주차별 증감 계산
     */
    List<WeeklyDeltaDto> getWeeklyDeltas(Integer customerNo, int weeks);

    /**
     * 최근 N일간 일별 증감 계산
     */
    List<WeeklyDeltaDto> getDailyDeltas(Integer customerNo, int days);

    /**
     * 최근 N개월간 월별 증감 계산
     */
    List<WeeklyDeltaDto> getMonthlyDeltas(Integer customerNo, int months);

    /**
     * 최근 4개월간 월별 추이 (적금, 투자, 순자산 변화)
     */
    List<MonthlyTrendDto> getMonthlyTrends(Integer customerNo, int months);

    /**
     * 30일간 총 증감 및 적금/투자 납입 합계
     */
    MonthlyTrendDto getLast30DaysSummary(Integer customerNo);
}




