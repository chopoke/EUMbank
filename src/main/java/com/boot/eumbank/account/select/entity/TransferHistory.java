package com.boot.eumbank.account.select.entity;


import com.boot.eumbank.account.open.entity.account.Account;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 이체 내역 도메인 엔티티
 */
@Entity
@Table(name = "TRANSFER_HISTORY_TBL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class) @Setter
public class TransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "th_transfer_no", nullable = false)
    private Integer transferNo;

    @Column(name = "th_transfer_id", nullable = false, length = 20)
    private String transferId;

    @Column(name = "a_no", nullable = false)
    private Integer accountNo;

    @Column(name = "th_amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "th_memo", length = 100)
    private String memo;

    @Column(name = "th_transfer_at", nullable = false)
    private LocalDateTime transferAt;

    @Column(name = "th_other_bank", length = 100)
    private String otherBank;

    @Column(name = "th_other_account", length = 100)
    private String otherAccount;

    @Column(name = "th_transfer_type", nullable = false, length = 30)
    private String transferType;

    @Column(name = "th_after_balance", nullable = false)
    private BigDecimal afterBalance;

    @Column(name = "th_transaction_type", length = 100)
    private String transactionType;

    @Column(name = "th_account_out")
    private BigDecimal accountOut;

    @Column(name = "th_account_in")
    private BigDecimal accountIn;

    // 관계 설정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "a_no", referencedColumnName = "a_no", insertable = false, updatable = false)
    private Account account;

    @Builder
    public TransferHistory(Integer transferNo, String transferId, Integer accountNo,
                           BigDecimal amount, String memo, String otherBank,
                           String otherAccount, String transferType,
                           BigDecimal afterBalance, String transactionType,
                           BigDecimal accountOut, BigDecimal accountIn) {
        this.transferNo = transferNo;
        this.transferId = transferId;
        this.accountNo = accountNo;
        this.amount = amount;
        this.memo = memo;
        this.transferAt = LocalDateTime.now();
        this.otherBank = otherBank;
        this.otherAccount = otherAccount;
        this.transferType = transferType;
        this.afterBalance = afterBalance;
        this.transactionType = transactionType;
        this.accountOut = accountOut;
        this.accountIn = accountIn;
    }

    // 비즈니스 메서드
    public boolean isDeposit() {
        return "DEPOSIT".equals(transferType);
    }

    public boolean isWithdrawal() {
        return "WITHDRAWAL".equals(transferType);
    }

    public boolean isTransfer() {
        return "TRANSFER".equals(transferType);
    }

    public String getDisplayMemo() {
        return memo != null ? memo : "-";
    }
}
