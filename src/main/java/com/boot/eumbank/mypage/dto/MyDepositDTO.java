// src/main/java/com/boot/eumbank/mypage/dto/MyDepositDTO.java
package com.boot.eumbank.mypage.dto;

import java.time.LocalDate;

public record MyDepositDTO(
        Integer id,
        String  productName,
        Long    balance,
        LocalDate openDate,     // d_join_date (yyyy-MM-dd)
        LocalDate maturityAt,   // d_maturity_date (yyyy-MM-dd)
        Integer termMonths      // 총 개월 수 (없어도 되지만 있으면 프론트가 더 정확)
) {}
