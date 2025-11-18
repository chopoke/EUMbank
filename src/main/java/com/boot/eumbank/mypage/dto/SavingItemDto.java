// src/main/java/com/boot/eumbank/mypage/dto/SavingItemDto.java
package com.boot.eumbank.mypage.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class SavingItemDto {

    private String id;
    private String productName;

    // 진행 정보
    private Integer totalInstallments;   // 전체 회차 (i_month)
    private Integer paidInstallments;    // 납입 회차
    private Integer monthlyAmount;       // 월 납입 금액
    private String  nextDueDate;         // 다음 납입일 (yyyy-MM-dd)

    // 금액 기준 진행률
    private Long principalBalance;       // i_principal_bal (현재 원금 잔액)
    private Long expectedMaturityAmount; // i_expected_maturity_amount (만기 예상 금액)

    // 상품 스펙
    private String  ipName;
    private String  ipType;
    private String  ipRate;
    private Integer ipMinMonths;
    private Integer ipMaxMonths;
    private Integer ipMinMonthlyAmount;
    private Integer ipMaxMonthlyAmount;
    private String  ipInterestPaymentType;
    private String  ipEarlyTerminationRate;
    private String  ipFeature;
    private String  ipButtonText;
    private String  ipHref;
}
