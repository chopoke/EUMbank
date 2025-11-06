package com.boot.eumbank.management.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 주간 자산 증감 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDeltaDto {
    private String weekLabel;
    private BigDecimal deltaAmount;
}




