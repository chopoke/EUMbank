package com.boot.eumbank.asset.peer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 자산관리 데이터 엔티티
 */
@Entity
@Table(
        name = "ASSET_MANAGEMENT_DATA_TBL",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_ASSET_MGMT_DATA_CNO", columnNames = {"c_no"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetManagementData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "amd_no")
    private Integer amdNo;

    @Column(name = "c_no", nullable = false)
    private Integer cno;

    @Column(name = "amd_gender", length = 1, nullable = false)
    private String amdGender;          // 'M'/'F'

    @Column(name = "amd_age_band", nullable = false)
    private Integer amdAgeBand;        // 20, 30, 40, 50, 60

    @Column(name = "amd_income_cd", length = 20, nullable = false)
    private String amdIncomeCd;         // I1~I6 등 코드

    @Column(name = "amd_income_min", nullable = false)
    private Integer amdIncomeMin;          // 하한(만원)

    @Column(name = "amd_income_max")
    private Integer amdIncomeMax;          // 상한(만원, 오픈엔드면 NULL)

    @Column(name = "amd_job_cd", length = 25, nullable = false)
    private String amdJobCd;            // J1~J8 등 코드

    @Column(name = "amd_region", length = 20, nullable = false)
    private String amdRegion;

    @Column(name = "amd_created", nullable = false, updatable = false)
    private LocalDateTime amdCreatedAt;

    @Column(name = "amd_updated", nullable = false)
    private LocalDateTime amdUpdatedAt;

    @Column(name = "amd_total_assets", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalAssets;

    @Column(name = "amd_total_liabilities", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalLiabilities;

    @Column(name = "amd_net_worth", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdNetWorth;

    @Column(name = "amd_total_cash", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalCash;

    @Column(name = "amd_total_installment", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalInstallment;

    @Column(name = "amd_total_deposit", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalDeposit;

    @Column(name = "amd_total_foreign", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalForeign;

    @Column(name = "amd_total_gold", precision = 20, scale = 2, nullable = false)
    private BigDecimal amdTotalGold;

}
