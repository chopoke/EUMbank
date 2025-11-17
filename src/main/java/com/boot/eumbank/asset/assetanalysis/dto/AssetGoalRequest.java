package com.boot.eumbank.asset.assetanalysis.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 자산 목표 설정/수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetGoalRequest {
    
    /**
     * 목표 순자산 금액
     */
    @NotNull(message = "목표 금액을 입력해주세요.")
    @DecimalMin(value = "0.0", inclusive = false, message = "목표 금액은 0보다 커야 합니다.")
    private BigDecimal targetAmount;
    
    /**
     * 목표 달성 날짜 (선택사항)
     */
    private LocalDate targetDate;
}



