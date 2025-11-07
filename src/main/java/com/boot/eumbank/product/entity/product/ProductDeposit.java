package com.boot.eumbank.product.entity.product;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor  // 추가
@Builder
@Entity
@Table(name = "DEPOSIT_TBL")
@ToString
public class ProductDeposit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "d_no")
    private Integer dNo;

    @Column(name = "dp_no")
    private Integer dpNo;

    @Column(name = "c_no")
    private Integer cNo;

    @Column(name = "a_no")
    private Integer aNo;

    @Column(name = "d_id", length = 50)
    private String dId;

    @Column(name = "d_account_no", length = 50)
    private String dAccountNo;

    @Column(name = "d_join_date")
    private LocalDateTime dJoinDate;

    @Column(name = "d_maturity_date")
    private LocalDateTime dMaturityDate;

    @Column(name = "d_amount")
    private long dAmount;

    @Column(name = "d_interest_rate", precision = 5, scale = 2)
    private BigDecimal dInterestRate;

    @Column(name = "d_status", length = 20)
    private String dStatus;

    @Column(name = "d_updated_at")
    private LocalDateTime dUpdatedAt;

    @Column(name = "d_freeze_yn", length = 1)
    private String dFreezeYn;

    @Column(name = "d_dormant_yn", length = 1)
    private String dDormantYn;

    @Column(name = "d_apy", precision = 5, scale = 2)
    private BigDecimal dApy;

    @Column(name = "d_accr_int", precision = 15, scale = 2)
    private BigDecimal dAccrInt;

    @Column(name = "d_principal_bal")
    private long dPrincipalBal;

    @Column(name = "a_account_no")
    private String aAccountNo;

    @Column(name= "d_period")
    private Integer dPeriod;

    @Column(name= "d_count_period")
    private Integer dCountPeriod;

    @Column(name= "d_fail")
    private Integer dFail;

    @Column(name= "d_expected_maturity_amount")
    private long dExpectedMaturityAmount;

    @Column(name= "d_pdf_path")
    private String dPdfPath;
}