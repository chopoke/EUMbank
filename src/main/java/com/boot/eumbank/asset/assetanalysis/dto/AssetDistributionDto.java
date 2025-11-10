package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 자산 배분 정보 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDistributionDto {
    private BigDecimal cashPercentage;
    private BigDecimal depositPercentage;
    private BigDecimal investmentPercentage;
    private BigDecimal foreignPercentage;
    private BigDecimal totalAmount;
    private String recommendation;
}




