package com.boot.eumbank.foreign.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxExchangeCalcRespDto {

    // 거래 통화 단위
    private String fromCurUnit;

    // 최종 받을 통화 단위
    private String toCurUnit;

    // 환전 요청 금액 (외화 단위)
    private BigDecimal fromAmount;

    // 매매 기준율 (원/외화)
    private BigDecimal exchangeRate;

    // 우대율 적용 최종 환율
    private BigDecimal finalExchangeRate;

    // 예상 수수료 (원화 환산 금액)
    private BigDecimal expectedCommission;

    // 예상 수령액 (KRW 또는 toCurUnit 단위)
    private BigDecimal expectedReceiveAmount;

    // 원화로 환산되는 기준 금액
    private BigDecimal baseRateToKrw;
}
