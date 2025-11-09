package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record TopDepositDto(
        String productName,     // dp_name (상품명)
        Integer month,         // d_period (가입개월)
        BigDecimal rate,        // d_apy (이율)
        Long amount            // d_amount (잔액)
) {}
