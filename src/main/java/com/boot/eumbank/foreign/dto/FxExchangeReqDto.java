// src/main/java/com/boot/eumbank/foreign/dto/FxExchangeReqDto.java
package com.boot.eumbank.foreign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 환전 요청 DTO
 * BUY  : KRW -> FX  (fromAccountNo=원화,  toAccountNo=외화)
 * SELL : FX  -> KRW (fromAccountNo=외화,  toAccountNo=원화)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxExchangeReqDto {

    /** FROM 통화코드 (컨트롤러에서 ISO3 정규화) */
    private String fromCurUnit;

    /** TO 통화코드 (컨트롤러에서 ISO3 정규화) */
    private String toCurUnit;

    /** 입력 금액 (BUY: KRW 금액, SELL: 외화 금액) */
    private BigDecimal fxAmount;

    /** 우대율(%) — 예: 5.0 -> 5% */
    private BigDecimal commissionRate;

    /** 거래유형: BUY | SELL */
    private String transactionType;

    /** 출금 계좌번호 (필수) */
    private String fromAccountNo;

    /** 입금 계좌번호 (필수) — ★ 신규 */
    private String toAccountNo;

    /** 요청자 고객번호(선택; 없으면 서비스에서 fromAccount 소유주로 보정) */
    private Long cNo;

    /** 메모(선택) */
    private String memo;
}
