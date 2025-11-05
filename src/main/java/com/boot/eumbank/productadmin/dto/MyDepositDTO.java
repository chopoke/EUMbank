// src/main/java/com/boot/eumbank/product/dto/product/MyDepositDTO.java
package com.boot.eumbank.productadmin.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyDepositDTO {
    private Integer id;              // d_no
    private String productName;      // dp_name (join)
    private String productCode;      // d_id
    private String accountNumber;    // d_account_no
    private Long amount;             // d_amount
    private BigDecimal rate;         // d_interest_rate
    private String startDate;        // d_join_date
    private String maturityDate;     // d_maturity_date
    private String type;             // "예금"
    private String status;           // d_status
    private Integer period;          // d_period
    private String linkedAccount;    // a_account_no
}