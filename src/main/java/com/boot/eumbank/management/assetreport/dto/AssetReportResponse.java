package com.boot.eumbank.management.assetreport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 월간 리포트 응답 DTO
 * 캘린더에 표시할 일별 증감 요약 데이터를 포함
 * 
 * @author 임형욱
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetReportResponse {
    /**
     * 조회한 년월 (YYYY-MM 형식)
     */
    private String yearMonth;
    
    /**
     * 일별 증감 요약 리스트
     */
    private List<DailySummaryDto> dailySummaries;
    
    /**
     * 월간 수입 합계
     */
    private Long totalIncome;
    
    /**
     * 월간 지출 합계
     */
    private Long totalExpense;
    
    /**
     * 월간 순변동 (수입 - 지출)
     */
    private Long netChange;
    
    /**
     * 지출 카테고리별 집계
     */
    private List<CategorySummaryDto> categorySummaries;
}

