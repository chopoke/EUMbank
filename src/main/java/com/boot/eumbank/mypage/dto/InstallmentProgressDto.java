// com.boot.eumbank.mypage.dto.InstallmentProgressDto
package com.boot.eumbank.mypage.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value @Builder
public class InstallmentProgressDto {
    Integer iNo;
    Integer aNo;
    String  productName;

    int     totalInstallments;   // i_month
    int     paidInstallments;    // 계산된 납입 회차
    int     progressPct;         // 진행률(0~100)
    LocalDate nextDueDate;       // 다음 납입 예정일 (프론트 nextDueDate로 내려주면 됨)
}
