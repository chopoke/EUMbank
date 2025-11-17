// src/main/java/com/boot/eumbank/mypage/dto/DepositItemDto.java
package com.boot.eumbank.mypage.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DepositItemDto {
    private String  id;
    private String  productName;
    private Integer balance;               // 잔액(d_principal_bal)
    private Integer goalAmount;            // 가입/목표 금액(d_amount)
    private String  openedAt;              // yyyy-MM-dd
    private String  maturityAt;            // yyyy-MM-dd
    private Integer termMonths;            // 계약 개월 (있으면)

    private String   dpName;
    private String   dpType;
    private String   dpRate;               // BigDecimal/Double 원하면 타입 변경
    private Integer  dpMinMonths;
    private Integer  dpMaxMonths;
    private Integer  dpMinAmount;
    private Integer  dpMaxAmount;
    private String   dpInterestPaymentType;
    private String   dpEarlyTerminationRate;
    private String   dpFeature;            // 필요 시 List<String> 로
    private String   dpButtonText;
    private String   dpHref;
    private Long principalBalance;
}
