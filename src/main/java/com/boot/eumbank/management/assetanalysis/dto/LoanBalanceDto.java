package com.boot.eumbank.management.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 대출 잔액 DTO
 * 순자산 계산 시 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanBalanceDto {
    /**
     * 미상환 대출 잔액 (원)
     * 양수로 저장되어 있으므로 순자산 계산 시 차감해야 함
     */
    private BigDecimal outstandingBalance;
}

