package com.boot.eumbank.asset.peer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * 또래비교 데이터 엔티티
 */
@Entity
@Table(
        name = "ASSET_PEER_DATA_TBL",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "ux_apd",
                        columnNames = {"apd_gender","apd_age_band","apd_income_cd","apd_job_cd","apd_region_cd"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetPeerData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apd_no")
    private Integer apdNo;

    @Column(name = "apd_gender", length = 1, nullable = false)
    private String apdGender;

    @Column(name = "apd_age_band", nullable = false)
    private Integer apdAgeBand;

    @Column(name = "apd_income_cd", length = 20, nullable = false)
    private String apdIncomeCd;

    @Column(name = "apd_job_cd", length = 25, nullable = false)
    private String apdJobCd;

    @Column(name = "apd_region_cd", length = 20, nullable = false)
    private String apdRegionCd;

    @Column(name = "apd_n_customers", nullable = false)
    private Integer apdNCustomers;

    @Column(name = "apd_total_assets", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalAssets;

    @Column(name = "apd_total_liabilities", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalLiabilities;

    @Column(name = "apd_net_worth", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdNetWorth;

    @Column(name = "apd_total_cash", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalCash;

    @Column(name = "apd_total_installment", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalInstallment;

    @Column(name = "apd_total_deposit", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalDeposit;

    @Column(name = "apd_total_foreign", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalForeign;

    @Column(name = "apd_total_gold", precision = 20, scale = 2, nullable = false)
    private BigDecimal apdTotalGold;

}
