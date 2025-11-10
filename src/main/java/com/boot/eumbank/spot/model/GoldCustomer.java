package com.boot.eumbank.spot.model;

/**
 * 이 클래스는 현물거래 고객의 현금/금/은 보유 상태를 나타내는 엔티티입니다.
 * 목적
 *  - 현물지갑(현금)과 금/은 보유량 관리
 * 사용
 *  - 거래 시 보유량/현금 잔액 갱신의 기준이 됩니다.
 */

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

@Entity
@Table(name = "GOLD_CUSTOMER_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldCustomer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gc_no")
    private Integer gcNo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    @Column(name = "gc_cash_balance", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gcCashBalance = BigDecimal.ZERO;

    @Column(name = "gc_gold_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gcGoldBalance = BigDecimal.ZERO;

    @Column(name = "gc_silver_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gcSilverBalance = BigDecimal.ZERO;

    @Column(name = "gc_total_investment", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gcTotalInvestment = BigDecimal.ZERO;

    @Column(name = "gc_total_profit_loss", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gcTotalProfitLoss = BigDecimal.ZERO;

    @Column(name = "gc_active_yn", length = 1, nullable = false)
    @Builder.Default
    private String gcActiveYn = "Y";

    @CreationTimestamp
    @Column(name = "gc_created_at", nullable = false, updatable = false)
    private LocalDateTime gcCreatedAt;

    @UpdateTimestamp
    @Column(name = "gc_updated_at", nullable = false)
    private LocalDateTime gcUpdatedAt;
}
