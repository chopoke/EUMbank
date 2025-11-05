package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "LOAN_TBL")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Loan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "l_no")
    private Long lNo;            // 대출 No (PK)

    @Column(name = "l_id")
    private String lId;          // 대출ID

    @Column(name = "la_no")
    private Long laNo;           // 대출신청No(FK)

    @Column(name = "c_no")
    private int cNo;             // 고객 번호(FK)

    @Column(name = "a_no")
    private int aNo;             // 계좌 넘버(FK) --> a_account_no

    @Column(name = "l_repay_a_no")
    private int repayAccount;     // 상환용 계좌 번호No

    @Column(name = "lpd_no")
    private Long lpdNo;           // 상품 번호 ( FK)

    @Column(name = "l_principal_amount")
    private BigDecimal principalAmount;     // 집행 금액

    @Column(name = "l_currency")
    private String currency;                // 통화

    @Column(name = "l_rate_type")
    private String rateType;                // 적용금리유형(고정금리/변동금리)

    @Column(name = "l_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal balance;             // 상환 후 잔액

    @Column(name = "l_interest_rate")
    private BigDecimal interestRate;        // 적용금리

    @Column(name = "l_spread_rate")
    private BigDecimal spreadRate;          // 가산금리

    @Column(name = "l_repay_method")
    private String repayMethod;              // 상환방식(EQUAL_PNI/EQUAL_PRINCIPAL/BULLET/IO_THEN_PNI)

    @Column(name = "l_term_month")
    private int termMonth;                  // 대출기간
    
    @Column(name = "l_start_date")
    private LocalDateTime startDate;         // 대출 개시일

    @Column(name = "l_maturity_date")
    private LocalDateTime maturityDate;       // 만기일

    @Column(name = "l_pay_day")
    private int payDay;                         // 납입일(1~28)
    
    @Column(name = "l_status")
    private String status;              // 대출상태(ACTIVE/DELINQUENT/CLOSED)
    
    @Column(name = "l_created_at")
    private LocalDateTime createdAt;        // 대출개설일

    @Column(name = "l_closed_at")
    private LocalDateTime closedAt;         // 완제일 (해지)
    
    @Column(name = "l_last_paid_at")
    private LocalDateTime lastPaidAt;       // 마지막 상환일
}
