// DepositItemDto.java
package com.boot.eumbank.mypage.dto;

public record DepositItemDto(
        String id,
        String productName,
        Integer balance,
        Integer goalAmount,
        String openedAt,
        String maturityAt
) {}
