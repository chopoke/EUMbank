package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 기간별 추이 DTO (이체 내역 기반)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendDto {
    private String month;                 // 기간 라벨 (예: "11월", "1주", "14시", "14:30")
    private String periodStartDate;       // 기간 시작일 (ISO-8601, 예: "2025-11-01")
    private BigDecimal income;            // 수익 (입금액, 만원 단위)
    private BigDecimal expense;           // 소비 (출금액, 만원 단위)
    private BigDecimal net;               // 순변동 (수익 - 소비, 만원 단위)
    private BigDecimal netWorth;          // 해당 기간 말 순자산 (원 단위)
}










