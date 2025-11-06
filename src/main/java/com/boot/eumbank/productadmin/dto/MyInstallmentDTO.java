// src/main/java/com/boot/eumbank/product/dto/product/MyInstallmentDTO.java
package com.boot.eumbank.productadmin.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyInstallmentDTO {
    private Integer id;              // i_no
    private String productName;      // ip_name (join)
    private String productCode;      // i_id
    private String accountNumber;    // i_account_no
    private Long amount;             // i_amount
    private BigDecimal rate;         // i_interest_rate
    private String startDate;        // i_join_date
    private String maturityDate;     // i_maturity_date
    private String type;             // "적금"
    private String status;           // i_status
    private Integer period;          // i_month
    private String linkedAccount;    // a_account_no
    private Integer paidCount;       // i_paid_installments
}