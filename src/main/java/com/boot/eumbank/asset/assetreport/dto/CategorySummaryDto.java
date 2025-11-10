package com.boot.eumbank.asset.assetreport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 카테고리별 지출 집계 DTO
 * 지출 카테고리 차트에 사용
 * 
 * @author 임형욱
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryDto {
    /**
     * 카테고리 라벨 (예: "주거 · 관리비", "식비")
     */
    private String label;
    
    /**
     * 지출 금액 (원)
     */
    private Long amount;
    
    /**
     * 월간 지출 대비 비율 (%)
     */
    private Double percentage;
}

