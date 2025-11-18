package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record TopLoanDto(
        String  productName,    // 상품명
        Integer termMonth,      // 가입개월
        BigDecimal interestRate,// 약정금리
        BigDecimal balance      // 상환잔액
) {}
