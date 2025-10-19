package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Double lendRateMin;           // 최저금리

    @Column(name = "lpo_lend_rate_max")
    private Double lendRateMax;           // 최고금리

    @Column(name = "lpo_lend_rate_avg")
    private Double lendRateAvg;           // 평균(있을 때)
}
