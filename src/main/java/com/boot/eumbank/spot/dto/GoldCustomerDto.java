package com.boot.eumbank.spot.dto;

/**
 * 현물 고객의 보유 현황을 전달하는 DTO입니다.
 * 목적: 현금/금/은 보유량 등 요약 정보를 프론트로 전달
 * 사용: 잔고/지갑 관련 API 응답에 사용됩니다.
 */
import java.math.BigDecimal;

public class GoldCustomerDto {
    public Integer gcNo; /** 현물 고객 번호 */
    public Integer customerNo; /** 고객 번호 */
    public BigDecimal cash; /** 현금 잔액 */
    public BigDecimal gold; /** 금 보유량 (그램) */
    public BigDecimal silver; /** 은 보유량 (그램) */
    public BigDecimal totalInvestment; /** 총 투자 금액 */
    public BigDecimal totalProfitLoss; /** 총 손익 금액 */
    public String activeYn; /** 활성화 여부 (Y: 활성, N: 비활성) */
}



