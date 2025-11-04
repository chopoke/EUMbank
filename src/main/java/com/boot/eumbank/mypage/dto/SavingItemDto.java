// SavingItemDto.java
package com.boot.eumbank.mypage.dto;

public record SavingItemDto(
        String id,
        String productName,
        Integer totalInstallments,
        Integer paidInstallments,
        Integer monthlyAmount,
        String nextDueDate
) {}
