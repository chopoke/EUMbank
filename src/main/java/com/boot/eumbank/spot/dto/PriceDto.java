package com.boot.eumbank.spot.dto;

/**
 * 금/은 가격 정보를 전달하는 DTO입니다.
 * 목적: 시세 정보를 API에서 노출
 * 사용: 가격 조회 API 응답에 사용됩니다.
 */
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PriceDto {
    public String metalCode; /** 금속 코드 (AU: 금, AG: 은) */
    public BigDecimal basePrice; /** 기준가 */
    public BigDecimal buyPrice; /** 매수가 */
    public BigDecimal sellPrice; /** 매도가 */
    public BigDecimal fluctuationRate; /** 변동률 (%) */
    public LocalDateTime createdAt; /** 생성 일시 */
}



