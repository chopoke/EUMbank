package com.boot.eumbank.account.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class TransactionDTO {
    private int th_transfer_no;
    private String th_transfer_id;
    private int a_no;
    private int th_amount;
    private String th_transfer_type;
    private String th_transaction_type;
    private String th_memo;
    private String th_other_bank;
    private String th_other_account;
    private int th_after_balance;
    private Integer th_account_out;  // NULL 가능
    private Integer th_account_in;   // NULL 가능
    private Timestamp th_transfer_at;
}
