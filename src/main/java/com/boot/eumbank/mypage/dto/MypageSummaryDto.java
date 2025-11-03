package com.boot.eumbank.mypage.dto;

import java.math.BigDecimal;
import java.util.List;

public record MypageSummaryDto(
        double percent,     // 0~100 (적금 진행률)
        int paid,           // 납입회차 누계
        int total,          // 총 회차
        BigDecimal acc,     // 누적(원금+미지급이자)
        BigDecimal target,  // 목표(월납입*개월 합)
        String nextDueDate, // yyyy-MM-dd
        List<TopAccount> topAccounts
) {
    public record TopAccount(
            String type,        // "INSTALLMENT"
            String id,          // i_id
            String accountNo,   // i_account_no
            BigDecimal amount   // i_principal_paid + i_interest_accrued
    ) {}
}
