package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 대출 계약 테이블
 */
@Entity
@Table(name = "LOAN_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "l_no")
    private Long loanNo;                                    // 대출 번호 (PK)

    @Column(name = "c_no", nullable = false)
    private Integer customerNo;                             // 고객번호 (FK)

    @Column(name = "lpd_no", nullable = false)
    private Integer loanProductNo;                          // 대출 상품 번호

    @Column(name = "l_principal", nullable = false, precision = 18, scale = 2)
    private BigDecimal principal;                            // 대출 원금

    @Column(name = "l_interest_rate", nullable = false, precision = 5, scale = 3)
    private BigDecimal interestRate;                         // 이자율

    @Column(name = "l_term_months", nullable = false)
    private Integer termMonths;                              // 대출 기간 (개월)

    @Column(name = "l_status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";                        // 상태 (ACTIVE, CLOSED, DEFAULT 등)

    @Column(name = "l_created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();   // 대출 계약일

    @Column(name = "l_updated_at")
    private LocalDateTime updatedAt;                         // 수정일시
}

