package com.boot.eumbank.spot.dto;

/**
 * 현물 상품(금/은)의 표시용 정보를 전달하는 DTO입니다.
 * 목적: 상품 메타(상품ID, 금속코드, 명칭 등)를 API에서 노출
 * 사용: 컨트롤러 응답 혹은 서비스 계층 간 데이터 전달에 사용됩니다.
 */
import java.math.BigDecimal;

public class GoldProductDto {
    public Integer gpNo; /** 상품 번호 */
    public String gpId; /** 상품 ID (고유 식별자) */
    public String metalCode; /** 금속 코드 (AU: 금, AG: 은) */
    public String name; /** 상품명 */
    public BigDecimal weightG; /** 무게 (그램) */
    public BigDecimal purity; /** 순도 */
    public BigDecimal premiumPerG; /** 그램당 프리미엄 */
    public String activeYn; /** 활성화 여부 (Y: 활성, N: 비활성) */
}



