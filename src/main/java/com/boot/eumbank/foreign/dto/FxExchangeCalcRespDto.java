package com.boot.eumbank.foreign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxExchangeCalcRespDto {

    /** 출금 통화 (from). BUY=KRW, SELL=외화 */
    private String fromCurUnit;

    /** 입금(수취) 통화 (to). BUY=외화, SELL=KRW */
    private String toCurUnit;

    /** 출금 금액 (fromCurUnit 단위)
     *  - BUY: KRW 입력 금액
     *  - SELL: 외화 입력 금액
     */
    private BigDecimal fromAmount;

    /** 기준 환율 (KRW per 1 FX, 패널 표시용) */
    private BigDecimal exchangeRate;

    /** 우대율 적용 최종 환율 (KRW per 1 FX) */
    private BigDecimal finalExchangeRate;

    /** 예상 수수료 (KRW 환산 기준) — 실제 차감됨 */
    private BigDecimal expectedCommission;

    /** 예상 수취 금액 (toCurUnit 단위)
     *  - BUY: 외화 수취 금액
     *  - SELL: KRW 수취 금액
     */
    private BigDecimal expectedReceiveAmount;

    /** 기준율의 KRW 환산값(패널 표기용, exchangeRate와 동일 의미 유지 시 사용) */
    private BigDecimal baseRateToKrw;

    /** 프런트 입력칸 옆에 붙일 단위 라벨
     *  - BUY: "원"
     *  - SELL: 선택 외화의 한글 라벨(예: "엔", "호주 달러")
     */
    private String inputUnitLabel;

    /** 수취 금액 영역에 붙일 단위 라벨
     *  - BUY: 선택 외화 라벨(예: "엔", "호주 달러")
     *  - SELL: "원"
     */
    private String outputUnitLabel;

    /** ★ 표시용 수수료율 라벨 (예: "0.02%") */
    private String feeRateLabel;
}
