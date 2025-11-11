package com.boot.eumbank.asset.assetanalysis.repository;

import com.boot.eumbank.asset.assetanalysis.dto.AssetDistributionDto;
import com.boot.eumbank.asset.assetanalysis.dto.MonthlyTrendDto;
import com.boot.eumbank.asset.assetanalysis.dto.NextMonthScheduledTransferDto;
import com.boot.eumbank.asset.assetanalysis.dto.WeeklyDeltaDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
     * 최근 N시간간 시간별 증감 계산
     */
    List<WeeklyDeltaDto> getHourlyDeltas(Integer customerNo, int hours);

    /**
     * 최근 N분간 분별 증감 계산
     */
    List<WeeklyDeltaDto> getMinutelyDeltas(Integer customerNo, int minutes);

    /**
     * 기간별 추이 조회 (적금, 투자, 순자산 변화)
     * @param customerNo 고객번호
     * @param period 기간 (MINUTELY, HOURLY, DAILY, WEEKLY, MONTHLY)
     * @param count 개수
     */
    List<MonthlyTrendDto> getTrendsByPeriod(Integer customerNo, String period, int count);

    /**
     * 최근 N개월간 월별 추이 (적금, 투자, 순자산 변화)
     */
    List<MonthlyTrendDto> getMonthlyTrends(Integer customerNo, int months);

    /**
     * 30일간 총 증감 및 적금/투자 납입 합계
     */
    MonthlyTrendDto getLast30DaysSummary(Integer customerNo);

    /**
     * 다음달 예정된 예약/자동 이체 목록 조회
     *
     * @param customerNo 고객 번호
     * @param rangeStart 조회 시작 (포함)
     * @param rangeEnd   조회 종료 (포함)
     * @return 예정 이체 정보 목록
     */
    List<NextMonthScheduledTransferDto> findNextMonthScheduledTransfers(Integer customerNo, LocalDateTime rangeStart, LocalDateTime rangeEnd);
}




