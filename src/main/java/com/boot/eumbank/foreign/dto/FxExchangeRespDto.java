package com.boot.eumbank.foreign.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxExchangeRespDto {

    // 거래 고유 ID
    private String transactionId;

    // 거래 통화 단위
    private String fromCurUnit;

    // 최종 받을 통화 단위
    private String toCurUnit;

    // 환전 요청 금액 (외화 단위)
    private BigDecimal fromAmount;

    // 실제 수령한 금액
    private BigDecimal toAmount;

    // 최종 적용 환율
    private BigDecimal exchangeRate;

    // 최종 수수료 (원화 환산 금액)
    private BigDecimal commissionKrw;

    // 거래 완료 시각
    private LocalDateTime updatedAt;
}
