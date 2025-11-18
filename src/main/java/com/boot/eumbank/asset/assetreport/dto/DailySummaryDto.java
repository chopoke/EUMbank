package com.boot.eumbank.asset.assetreport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 일별 증감 요약 DTO
 * 캘린더에 표시할 하루치 수입/지출/순변동 정보
 * 
 * @author 임형욱
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailySummaryDto {
    /**
     * 날짜 (YYYY-MM-DD)
     */
    private LocalDate date;
    
    /**
     * 해당 날짜의 수입 합계 (원)
     */
    private Long income;
    
    /**
     * 해당 날짜의 지출 합계 (원)
     */
    private Long expense;
    
    /**
     * 해당 날짜의 순변동 (수입 - 지출, 원)
     */
    private Long netChange;
    
    /**
     * 거래 건수 (타인과의 거래만 카운트)
     */
    private Integer transactionCount;
}

