package com.boot.eumbank.spot.dto;

/**
 * 금/은 거래 내역을 전달하기 위한 DTO입니다.
 * 목적: API 응답에서 필요한 최소 정보만 노출
 * 사용: 컨트롤러 → 프론트엔드 데이터 전달에 사용됩니다.
 */
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GoldTblDto {
    public Integer gNo; /** 거래 번호 */
    public String gId; /** 거래 ID (고유 식별자) */
    public String transactionType; /** 거래 유형 (BUY: 매수, SELL: 매도) */
    public BigDecimal quantity; /** 거래 수량 (그램 단위) */
    public BigDecimal pricePerG; /** 그램당 가격 */
    public BigDecimal totalPrice; /** 총 거래 금액 */
    public BigDecimal feeAmount; /** 수수료 금액 */
    public BigDecimal taxAmount; /** 세금 금액 */
    public String status; /** 거래 상태 (COMPLETED: 완료, CANCELED: 취소, PENDING: 대기) */
    public LocalDateTime purchasedAt; /** 거래 일시 */
    public String metalCode; /** 금속 코드 (AU: 금, AG: 은) */
    public String productId; /** 상품 ID */
    public Integer customerNo; /** 고객 번호 */
    public String walletName; /** 거래에 사용된 지갑 이름 */
}



