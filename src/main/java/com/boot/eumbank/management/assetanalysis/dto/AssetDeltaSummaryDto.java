package com.boot.eumbank.management.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 자산 증감 요약 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDeltaSummaryDto {
    private List<WeeklyDeltaDto> weeklyDeltas;
    private BigDecimal totalDelta30Days;
    private String trendDescription;
    private BigDecimal savingTotal;
    private BigDecimal investmentTotal;
}




