// src/main/java/com/boot/eumbank/mypage/dto/InstallmentProductDto.java
package com.boot.eumbank.mypage.dto;

import lombok.Builder;
import lombok.Value;

@Value @Builder
public class InstallmentProductDto {
    String  ipName;
    String  ipType;
    Double  ipRate;

    Integer ipMinMonths;
    Integer ipMaxMonths;

    Double  ipMinMonthlyAmount;
    Double  ipMaxMonthlyAmount;

    Double  ipEarlyTerminationRate;
    String  ipInterestPaymentType;
    String  ipFeature;
    String  ipHref;
    String  ipButtonText;
}