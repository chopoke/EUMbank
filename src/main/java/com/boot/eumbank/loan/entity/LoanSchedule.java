package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 상환 스케쥴 테이블
 */
@Entity @Table(name = "LOAN_SCHEDULE_TBL")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ls_no")
    private Long lsNo;                                      // 스케쥴러id

    @Column(name = "l_no", nullable = false)
    private Long loanNo;

    @Column(name = "ls_installment_no", nullable = false)
    private Integer installmentNo;

    @Column(name = "ls_due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "ls_due_principal", nullable = false, precision = 18, scale = 2)
    private BigDecimal duePrincipal;

    @Column(name = "ls_due_interest", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueInterest;

    @Column(name = "ls_due_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueTotal;

    @Column(name = "ls_paid_principal", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidPrincipal;

    @Column(name = "ls_paid_interest", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidInterest;

    @Column(name = "ls_status", nullable = false, length = 20)
    private String status;                                      // DUE / PARTIAL / PAID / OVERDUE
}
