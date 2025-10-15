package com.boot.eumbank.account.select.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TransactionDTO {
    private int th_transfer_no;         // 이체번호
    private String th_transfer_id;      // 거래키
    private int a_no;                   // 계좌 넘버
    private int th_amount;              // 금액
    private String th_transfer_type;    // 입/출금 구분
    private String th_transaction_type; // 트랜잭션 타입
    private String th_memo;             // 메모
    private String th_other_bank;       // 다른 은행
    private String th_other_account;    // 받는 계좌
    private int th_after_balance;       // 보낸뒤 잔액
    private Integer th_account_out;     // 출금금액
    private Integer th_account_in;      // 입금금액
    private Timestamp th_transfer_at;   // 이체시간
}
