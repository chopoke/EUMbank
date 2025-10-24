package com.boot.eumbank.account.select.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AccountSummaryDTO {
    private int a_no;           // 계좌no
    private String a_id;        // 계좌id
    private String a_account_no;    // 계좌번호
    private String a_account_type;  // 계좌 타입
    private String a_currency;      // 통화
    private BigDecimal a_balance;   // 잔액
    private String a_nickname;      // 별칭
    private String a_status;        // 상태
    private LocalDateTime lastTransferAt;       // 최근거래일
}