package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record TopInstallmentCardDto(
        String productName,     // ip_name
        Integer month,         // i_month
        BigDecimal rate,        // ip_rate
        Long amount,           // i_amount (잔액)
        Long principalBal     // i_principal_bal (월 납입액)
) {}
