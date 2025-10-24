package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "LOAN_PRODUCT_OPTION_TBL",
        indexes = {
                @Index(name="idx_lpo_product", columnList="lpd_no")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanProductOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lpo_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lpd_no", referencedColumnName = "lpd_no")
    private LoanProduct product;          // 부모

    @Column(name = "lpo_rpay_type_nm", length = 50)
    private String rpayTypeNm;            // 상환방식명

    @Column(name = "lpo_lend_rate_type_nm", length = 50)
    private String lendRateTypeNm;        // 금리유형명(고정/변동/혼합 등)

    @Column(name = "lpo_lend_rate_min")
    private BigDecimal lendRateMin;           // 최저금리

    @Column(name = "lpo_lend_rate_max")
    private BigDecimal lendRateMax;           // 최고금리

    @Column(name = "lpo_lend_rate_avg")
    private BigDecimal lendRateAvg;           // 평균(있을 때)

    @Column(name = "lpo_term_month")
    private Integer termMonth;                            // 옵션 대출기간(개월)

    @Column(name = "lpo_dcls_month", length = 6)
    private String dclsMonth;                             // 옵션 공시월(YYYYMM)

    @Column(name = "lpo_is_overdraft", length = 1)
    private String isOverdraft;                           // 마이너스여부('Y'/'N')

    @Column(name = "lpo_note", length = 500)
    private String note;                                  // 표시용 비고
}
