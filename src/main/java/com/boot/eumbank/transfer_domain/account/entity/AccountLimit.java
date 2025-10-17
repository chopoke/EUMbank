package com.boot.eumbank.transfer_domain.account.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 계좌 한도 도메인 엔티티
 */
@Entity
@Table(name = "ACCOUNT_LIMIT_TBL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AccountLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "al_account_id", nullable = false)
    private Integer accountLimitId;

    @Column(name = "a_no", nullable = false)
    private Integer accountNo;

    @Column(name = "al_per_transfer_limit", nullable = false, precision = 18, scale = 2)
    private BigDecimal perTransferLimit;

    @Column(name = "al_daily_transfer_limit", nullable = false, precision = 18, scale = 2)
    private BigDecimal dailyTransferLimit;

    @Column(name = "al_monthly_transfer_limit", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyTransferLimit;

    @Column(name = "al_overdraft_limit", nullable = false, precision = 18, scale = 2)
    private BigDecimal overdraftLimit;

    @Builder
    public AccountLimit(Integer accountLimitId, Integer accountNo, BigDecimal perTransferLimit, 
                       BigDecimal dailyTransferLimit, BigDecimal monthlyTransferLimit,
                       BigDecimal overdraftLimit) {
        this.accountLimitId = accountLimitId;
        this.accountNo = accountNo;
        this.perTransferLimit = perTransferLimit;
        this.dailyTransferLimit = dailyTransferLimit;
        this.monthlyTransferLimit = monthlyTransferLimit;
        this.overdraftLimit = overdraftLimit;
    }

    // 비즈니스 메서드
    public boolean isWithinPerTransferLimit(BigDecimal amount) {
        return amount.compareTo(perTransferLimit) <= 0;
    }

    public boolean isWithinDailyTransferLimit(BigDecimal amount) {
        return amount.compareTo(dailyTransferLimit) <= 0;
    }

    public boolean isWithinMonthlyTransferLimit(BigDecimal amount) {
        return amount.compareTo(monthlyTransferLimit) <= 0;
    }

    public void updateLimits(BigDecimal perTransferLimit, BigDecimal dailyTransferLimit,
                           BigDecimal monthlyTransferLimit, BigDecimal overdraftLimit) {
        this.perTransferLimit = perTransferLimit;
        this.dailyTransferLimit = dailyTransferLimit;
        this.monthlyTransferLimit = monthlyTransferLimit;
        this.overdraftLimit = overdraftLimit;
    }
}
