package com.boot.eumbank.asset.assetanalysis.dto;

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
    private BigDecimal incomeTotal;      // 30일간 총 수익 (입금액, 만원 단위)
    private BigDecimal expenseTotal;     // 30일간 총 소비 (출금액, 만원 단위)
}




