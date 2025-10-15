package com.boot.eumbank.account.select.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.sql.Timestamp;

@Entity
@Data
@Table(name = "TRANSFER_HISTORY_TBL")
public class TransferHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int th_transfer_no;	        // '거래내역NO',
    private int a_no;			        // '계좌ID',(FK)

    @Column(unique = true, nullable = false)
    private String th_transfer_id;	    // '거래ID',(비즈키)

    private Integer th_amount;		        // '금액',
    private String th_memo;		        // '메모',
    private Timestamp th_transfer_at;	//  '거래일시',
    private String th_other_bank;	    //  '상대 은행',
    private String th_other_account;	// '상대 계좌',
    private String th_transfer_type;	// '입/출금 구분',
    private Integer th_after_balance;	    // '거래 후 잔액',
    private String th_transaction_type; // '거래 유형',
    private Integer th_account_out;	        //  '출금금액',
    private Integer th_account_in;	        // '입금금액',
}
