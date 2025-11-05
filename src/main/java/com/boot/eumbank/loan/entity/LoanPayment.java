package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 상환테이블
 */
@Entity @Table(name = "LOAN_PAYMENT_TBL")
@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class LoanPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lp_no")
    private Long lpNo;

    @Column(name = "l_no", nullable = false)
    private Long loanNo;                                        // 대출 번호 (loan_tbl)연결ㄹ

    @Column(name = "lp_id", nullable = false, length = 20)
    private String lpId;                                        // 대출별 유니크 아이디

    @Column(name = "ls_no")
    private Long scheduleId;                        // 옵션: 단일 타겟일 때 연결

    @Column(name = "lp_idempotency_key", length = 64)
    private String idempotencyKey;

    @Column(name = "lp_amount_received", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountReceived;

    @Column(name = "lp_principal_amt", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmt;

    @Column(name = "lp_interest_amt", nullable = false, precision = 18, scale = 2)
    private BigDecimal interestAmt;

    @Column(name = "lp_penalty_amt", nullable = false, precision = 18, scale = 2)
    private BigDecimal penaltyAmt;

    @Column(name = "lp_status", nullable = false, length = 20)
    private String status;                                          // POSTED, VOID 등

    @Column(name = "lp_installment_no")
    private Integer installmentNo;                      // 단일 회차 타겟이면 기록

    @Column(name = "lp_payment_time", nullable = false)
    private LocalDateTime paymentTime;
}
