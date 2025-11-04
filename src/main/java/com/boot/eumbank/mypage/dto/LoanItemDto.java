// LoanItemDto.java
package com.boot.eumbank.mypage.dto;

import java.math.BigDecimal;

public record LoanItemDto(
        String id,
        String productName,
        BigDecimal balance,
        BigDecimal rate,
        String openedAt,
        String maturityAt
) {}
