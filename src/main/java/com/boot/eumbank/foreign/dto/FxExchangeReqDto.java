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
public class FxExchangeReqDto {

    //고객번호
    private Long cNo;

    // 거래 통화 단위 (예: USD)
    private String fromCurUnit;

    // 최종 받을 통화 단위 (예: KRW)
    private String toCurUnit;

    // 출금 계좌 번호 (원화 계좌)
    private String fromAccountNo;

    // 환전 요청 금액 (외화 단위)
    private BigDecimal fxAmount;

    // 적용할 수수료율 (예: 5.0 -> 5% 우대)
    private BigDecimal commissionRate;

    // 거래 유형 (BUY/SELL)
    private String transactionType;

    // 메모
    private String memo;
}
