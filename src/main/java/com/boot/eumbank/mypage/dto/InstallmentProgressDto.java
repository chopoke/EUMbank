// com.boot.eumbank.mypage.dto.InstallmentProgressDto
package com.boot.eumbank.mypage.dto;

import lombok.Builder;
import lombok.Value;

// import java.time.LocalDate; // String으로 변경

@Value @Builder
public class InstallmentProgressDto {
    Integer iNo;
    Integer aNo;
    String  productName;

    int     progressPct;         // 진행률(0~100)

    String nextDueDate;
}