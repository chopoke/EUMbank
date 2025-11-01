package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Builder @NoArgsConstructor
@AllArgsConstructor
@Table(name = "LOAN_CREDIT_OPTION_TBL")
public class LoanCreditOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lco_no")
    private Long lcdNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lpd_no")
    private LoanProduct loanProduct;

    @Column(name="lco_crdt_lend_rate_type", nullable=false, length=1)
    private String rateType;                        // A:대출금리(최종), B:기준금리, C:가산금리' A가 없을때만 B+C

    @Column(name="lco_crdt_lend_rate_type_nm")
    private String rateTypeNm;                      // 대출금리명

    // 신용--------------
    @Column(name="lco_grad_1", precision=5, scale=2)
    private BigDecimal g1;
    @Column(name="lco_grad_4", precision=5, scale=2)
    private BigDecimal g4;
    @Column(name="lco_grad_5", precision=5, scale=2)
    private BigDecimal g5;
    @Column(name="lco_grad_6", precision=5, scale=2)
    private BigDecimal g6;
    @Column(name="lco_grad_10", precision=5, scale=2)
    private BigDecimal g10;
    @Column(name="lco_grad_11", precision=5, scale=2)
    private BigDecimal g11;
    @Column(name="lco_grad_12", precision=5, scale=2)
    private BigDecimal g12;
    @Column(name="lco_grad_13", precision=5, scale=2)
    private BigDecimal g13;
    @Column(name="lco_grad_avg", precision=5, scale=2)
    private BigDecimal avg;

    // 관리용----------
    @Column(name="lco_created_at" , insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime createdAt;
    @Column(name="lco_updated_at" , insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime updatedAt;

}
