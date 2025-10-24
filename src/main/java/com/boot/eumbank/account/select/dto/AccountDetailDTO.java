package com.boot.eumbank.account.select.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class AccountDetailDTO {
    private int a_no;
    private String a_id;
    private int c_no;
    private String a_product_code;
    private String a_account_no;
    private String a_account_type;
    private String a_currency;
    private BigDecimal a_balance;
    private String a_status;
    private String a_nickname;
    private LocalDateTime a_opened_at;
    private LocalDateTime a_closed_at;
    private LocalDateTime a_last_tx_at;
}
