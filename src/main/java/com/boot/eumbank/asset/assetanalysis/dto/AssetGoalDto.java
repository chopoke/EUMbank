package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 자산 목표 정보 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetGoalDto {
    private BigDecimal currentNetWorth;
    private BigDecimal targetNetWorth;
    private BigDecimal achievementRate;
    private LocalDate expectedAchievementDate;
    private String achievementStatus;
}




