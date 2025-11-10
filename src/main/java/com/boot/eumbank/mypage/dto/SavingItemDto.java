// src/main/java/com/boot/eumbank/mypage/dto/SavingItemDto.java
package com.boot.eumbank.mypage.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavingItemDto {
    private String  id;
    private String  productName;

    // 진행 정보
    private Integer totalInstallments;   // 총 회차 (계약 회차)
    private Integer paidInstallments;    // 납입 완료 회차
    private Integer monthlyAmount;       // 월 납입액
    private String  nextDueDate;         // 다음 납입일(yyyy-MM-dd)

    private String   ipName;
    private String   ipType;
    private String   ipRate;               // BigDecimal/Double 로 원하면 타입 바꿔도 됨
    private Integer  ipMinMonths;
    private Integer  ipMaxMonths;
    private Integer  ipMinMonthlyAmount;
    private Integer  ipMaxMonthlyAmount;
    private String   ipInterestPaymentType;
    private String   ipEarlyTerminationRate;
    private String   ipFeature;            // 필요 시 List<String> 로 변경 가능
    private String   ipButtonText;
    private String   ipHref;
}
