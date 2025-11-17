package com.boot.eumbank.asset.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;


/**
 * 자산관리 스냅샷 엔티티
 */
@Entity
@Table(
        name = "ASSET_DAILY_SNAPSHOT_TBL",
        uniqueConstraints = {@UniqueConstraint(name = "ux_asset_daily", columnNames = {"c_no", "ads_ymd"})}
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetDailySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ads_no")
    private Integer adsNo;

    @Column(name = "c_no", nullable = false)
    private Integer cno;

    @Column(name = "ads_ymd", nullable = false)
    private LocalDate adsYmd;

    @Column(name = "ads_total_assets", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalAssets;

    @Column(name = "ads_total_liabilities", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalLiabilities;

    @Column(name = "ads_net_worth", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsNetWorth;

    @Column(name = "ads_total_cash", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalCash;

    @Column(name = "ads_total_installment", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalInstallment;

    @Column(name = "ads_total_deposit", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalDeposit;

    @Column(name = "ads_total_foreign", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalForeign;

    @Column(name = "ads_total_gold", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalGold;
}
