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
 * 
 * DB 테이블: GOLD_WALLET_TBL
 * 자산관리 순자산 계산 시 사용 컬럼:
 *  - gw_cash_balance: 현물 현금 잔고 (원화)
 *  - gw_gold_balance: 금 보유량 (그램)
 *  - gw_silver_balance: 은 보유량 (그램)
 *  - c_no: 고객번호 (FK)
 */

@Entity
@Table(name = "GOLD_WALLET_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldWallet {

    /** 월렛 번호 (PK) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gw_no")
    private Integer gwNo;

    /** 고객 정보 (FK: CUSTOMER_TBL.c_no) - 자산관리 순자산 계산 시 고객별 조회용 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    /** 월렛 이름 */
    @Column(name = "gw_wallet_name", nullable = false, length = 50)
    private String gwWalletName;

    /** 현물계좌 통장 계좌번호 (형식: WL + 월렛번호) */
    @Column(name = "gw_account_no", length = 20, unique = true)
    private String gwAccountNo;

    /** 월렛 PIN 번호 (6자리) */
    @Column(name = "gw_pin", nullable = false, length = 6)
    private String gwPin;

    /** 현물 현금 잔고 (원화) - 자산관리 순자산 계산 시 사용 */
    @Column(name = "gw_cash_balance", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gwCashBalance = BigDecimal.ZERO;

    /** 금 보유량 (그램) - 자산관리 순자산 계산 시 사용 (현재 금 시세 × 보유량 = 평가금액) */
    @Column(name = "gw_gold_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gwGoldBalance = BigDecimal.ZERO;

    /** 은 보유량 (그램) - 자산관리 순자산 계산 시 사용 (현재 은 시세 × 보유량 = 평가금액) */
    @Column(name = "gw_silver_balance", precision = 10, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal gwSilverBalance = BigDecimal.ZERO;

    /** 총 잔고 (현재는 현금만 포함) */
    @Column(name = "gw_total_balance", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gwTotalBalance = BigDecimal.ZERO;

    /** 활성 여부 (Y: 활성, N: 비활성) */
    @Column(name = "gw_active_yn", length = 1, nullable = false)
    @Builder.Default
    private String gwActiveYn = "Y";

    /** 생성 일시 */
    @CreationTimestamp
    @Column(name = "gw_created_at", nullable = false, updatable = false)
    private LocalDateTime gwCreatedAt;

    /** 수정 일시 */
    @UpdateTimestamp
    @Column(name = "gw_updated_at", nullable = false)
    private LocalDateTime gwUpdatedAt;
}
