package com.boot.eumbank.account.select.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class TransactionDTO {
    private int th_transfer_no;             // 이체번호
    private String th_transfer_id;          // 거래키
    private int a_no;                       // 계좌 넘버
    private BigDecimal th_amount;           // 금액
    private String th_transfer_type;        // 입/출금 구분
    private String th_transaction_type;     // 트랜잭션 타입  -> 이체완료인지 이체실패(OUT)
    private String th_memo;                 // 메모
    private String th_other_bank;           // 다른 은행
    private String th_other_account;        // 받는 계좌
    private BigDecimal th_after_balance;    // 보낸뒤 잔액
    private BigDecimal th_account_out;      // 출금금액
    private BigDecimal th_account_in;       // 입금금액
    private LocalDateTime th_transfer_at;   // 이체시간
}
