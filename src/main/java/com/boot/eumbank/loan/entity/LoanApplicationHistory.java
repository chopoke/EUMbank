package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity @Table(name = "LOAN_APPLICATION_HISTORY_TBL")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanApplicationHistory {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="lah_disb_no") private Long disbNo;

    @Column(name="l_no", nullable=false)
    private Long loanNo;
    @Column(name="lah_thransfer_id", nullable=false, length=20)
    private String disbId;                          //
    @Column(name="lah_thransfer_date")
    private LocalDateTime disbDate;
    @Column(name="lah_amount", nullable=false)
    private BigDecimal amount;
    @Column(name="lah_bank_code")
    private String bankCode;
    @Column(name="lah_recieve_acc")
    private String receiveAccount;
    @Column(name="lah_memo")
    private String memo;
}
