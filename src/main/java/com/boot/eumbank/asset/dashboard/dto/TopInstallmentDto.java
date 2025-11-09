package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record TopInstallmentDto(
        String productName,     // ip_name (상품명)
        Integer month,         // i_month (가입개월)
        String rate,        // ip_rate (이율)
        Long amount,           // i_amount (잔액)
        Long principalBal     // i_principal_bal (월 납입액)
) {}
