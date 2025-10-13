package com.boot.eumbank.account.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "ACCOUNT_LIMIT_TBL")
@Data
public class AccountLimit {
    @Id
    private String al_a_id;                     //  '계좌ID',
    private BigDecimal al_per_transfer_limit;   //  '1회 이체 한도',
    private BigDecimal al_daily_transfer_limit; // '1일 이체 한도',
    private BigDecimal al_monthly_transfer_limit; // '월 이체 한도',
    private BigDecimal al_overdraft_limit;      // 초과 이체 한도',
}
