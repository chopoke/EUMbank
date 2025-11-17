// src/main/java/com/boot/eumbank/mypage/dto/LoanItemDto.java
package com.boot.eumbank.mypage.dto;

import java.math.BigDecimal;

public record LoanItemDto(
        String id,
        String productName,

        // 핵심 수치
        BigDecimal principal,   // 원금
        BigDecimal balance,     // 남은 원금(잔액)
        BigDecimal rate,        // 약정 금리

        // 기간
        Integer termMonths,     // 기간(개월)
        String  openedAt,       // 개시일
        String  maturityAt,     // 만기일

        // 조건(모달 하단)
        String  loanType,       // 대출종류 (상품유형)
        String  repayMethod,    // 상환방식
        String  rateType,       // 금리유형
        String  lender          // 은행/금융사

) {}
