package com.boot.eumbank.product.entity.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "INSTALLMENT_TBL")
public class ProductInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "i_no")
    private Integer iNo;

    @Column(name = "ip_no")
    private Integer ipNo;

    @Column(name = "c_no")
    private Integer cNo;

    @Column(name = "a_no")
    private Integer aNo;

    @Column(name = "i_id", length = 50)
    private String iId;

    @Column(name = "i_account_no", length = 50)
    private String iAccountNo;

    @Column(name = "i_join_date")
    private LocalDateTime iJoinDate;

    @Column(name = "i_maturity_date")
    private LocalDateTime iMaturityDate;

    @Column(name = "i_month")
    private Integer iMonth;

    @Column(name = "i_amount", precision = 15, scale = 2)
    private long iAmount;

    @Column(name = "i_currency", length = 10)
    private String iCurrency;

    @Column(name = "i_interest_rate", precision = 5, scale = 2)
    private BigDecimal iInterestRate;

    @Column(name = "i_pay_day")
    private String iPayDay;

    @Column(name = "i_status", length = 20)
    private String iStatus;

    @Column(name = "i_paid_installments")
    private Integer iPaidInstallments;

    @Column(name = "i_principal_paid", precision = 15, scale = 2)
    private Integer iPrincipalPaid;

    @Column(name = "i_interest_accrued", precision = 15, scale = 2)
    private Integer iInterestAccrued;

    @Column(name = "i_bonus_amt", precision = 15, scale = 2)
    private BigDecimal iBonusAmt;

    @Column(name = "i_arrears_cnt")
    private Integer iArrearsCnt;

    @Column(name = "i_arrears_amt", precision = 15, scale = 2)
    private BigDecimal iArrearsAmt;

    @Column(name = "i_updated_at")
    private LocalDateTime iUpdatedAt;

    @Column(name = "a_account_no")
    private String aAccountNo;

    @Column(name= "i_count_period")
    private Integer iCountPeriod;

    @Column(name= "i_fail")
    private Integer iFail;

    @Column(name = "i_principal_bal")
    private long iPrincipalBal;
}