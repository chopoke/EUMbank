package com.boot.eumbank.spot.dto;

/**
 * 현물거래 월렛 정보를 전달하기 위한 DTO입니다.
 * 목적: API 응답에서 월렛 정보 전달
 * 사용: 컨트롤러 → 프론트엔드 월렛 데이터 전달에 사용됩니다.
 */
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GoldWalletDto {
    public Integer gwNo; /** 월렛 번호 */
    public Integer customerNo; /** 고객 번호 */
    public String walletName; /** 월렛 이름 */
    public String accountNo; /** 현물계좌 통장 계좌번호 */
    public String pin; /** 월렛 PIN 번호 */
    public BigDecimal cashBalance; /** 현금 잔액 */
    public BigDecimal goldBalance; /** 금 보유량 (그램) */
    public BigDecimal silverBalance; /** 은 보유량 (그램) */
    public BigDecimal totalBalance; /** 총 잔액 */
    public String activeYn; /** 활성화 여부 (Y: 활성, N: 비활성) */
    public LocalDateTime createdAt; /** 생성 일시 */
    public LocalDateTime updatedAt; /** 수정 일시 */
}
