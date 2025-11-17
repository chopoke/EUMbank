// src/main/java/com/boot/eumbank/mypage/dto/MyDepositDTO.java
package com.boot.eumbank.mypage.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.math.BigDecimal;

@JsonInclude(Include.NON_NULL)
public record MyDepositDTO(
        String  id,
        String  productName,
        Integer balance,                     // d_principal_bal
        Integer goalAmount,                  // d_amount
        String  openedAt,                    // yyyy-MM-dd
        String  maturityAt,                  // yyyy-MM-dd
        Integer termMonths,

        String     dpName,
        String     dpType,
        BigDecimal dpRate,
        Integer    dpMinMonths,
        Integer    dpMaxMonths,
        BigDecimal dpMinAmount,
        BigDecimal dpMaxAmount,
        String     dpInterestPaymentType,
        BigDecimal dpEarlyTerminationRate,
        Object     dpFeature,                // String or List<String>
        String     dpButtonText,
        String     dpHref,

        //  만기 예상 금액 (d_expected_maturity_amount)
        Long       expectedMaturityAmount
) {}
