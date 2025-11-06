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
    private Integer cNo;

    @Column(name = "ads_ymd", nullable = false)
    private LocalDate adsYmd;

    @Column(name = "ads_total_assets", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalAssets;

    @Column(name = "ads_total_liabilities", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsTotalLiabilities;

    @Column(name = "ads_net_worth", precision = 20, scale = 2, nullable = false)
    private BigDecimal adsNetWorth;

}
