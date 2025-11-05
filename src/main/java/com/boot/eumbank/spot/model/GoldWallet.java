package com.boot.eumbank.spot.model;

import com.boot.eumbank.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 이 클래스는 현물거래 월렛 정보를 나타내는 엔티티입니다.
 * 목적
 *  - 고객별 다중 월렛 관리 (기본월렛, 투자월렛 등)
 * 사용
 *  - 월렛별 개별 PIN, 잔고 관리에 사용됩니다.
 */

@Entity
@Table(name = "GOLD_WALLET_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gw_no")
    private Integer gwNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    @Column(name = "gw_wallet_name", nullable = false, length = 50)
    private String gwWalletName;

    @Column(name = "gw_pin", nullable = false, length = 6)
    private String gwPin;

    @Column(name = "gw_cash_balance", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gwCashBalance = BigDecimal.ZERO;

    @Column(name = "gw_gold_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gwGoldBalance = BigDecimal.ZERO;

    @Column(name = "gw_silver_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gwSilverBalance = BigDecimal.ZERO;

    @Column(name = "gw_total_balance", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gwTotalBalance = BigDecimal.ZERO;

    @Column(name = "gw_active_yn", length = 1, nullable = false)
    @Builder.Default
    private String gwActiveYn = "Y";

    @CreationTimestamp
    @Column(name = "gw_created_at", nullable = false, updatable = false)
    private LocalDateTime gwCreatedAt;

    @UpdateTimestamp
    @Column(name = "gw_updated_at", nullable = false)
    private LocalDateTime gwUpdatedAt;
}
