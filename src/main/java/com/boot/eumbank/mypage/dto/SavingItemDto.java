// src/main/java/com/boot/eumbank/mypage/dto/SavingItemDto.java
package com.boot.eumbank.mypage.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavingItemDto {
    private String id;
    private String productName;

    private Integer totalInstallments; // 계약 회차 (6 vs 12 불일치 확인 필요)
    private Integer paidInstallments;  // 납입 회차
    private Integer monthlyAmount;     // 월 납입액
    private String nextDueDate;        // 다음 납입일

    private InstallmentProductDto product;
}