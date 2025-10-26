package com.boot.eumbank.account.open.entity.account;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ACCOUNT_TBL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "a_no")
    private Integer aNo;

    @Column(name = "a_id", length = 20)
    private String aId;

    @Column(name = "c_no")
    private Integer cNo;                 // FK(정규화하려면 @ManyToOne로 바꿀 수 있음)

    @Column(name = "a_account_no", length = 30, nullable = false, unique = true)
    private String accountNo;

    @Column(name = "a_app_id")
    private Integer appId;

    @Column(name = "a_product_code", length = 30)
    private String productCode;

    @Column(name = "a_account_type", length = 20)
    private String accountType;

    @Column(name = "a_opened_at")
    private LocalDateTime openedAt;

    @Column(name = "a_account_pwd", length = 100) // BCrypt 대비
    private String accountPwd;

    @Column(name = "a_closed_at")
    private LocalDateTime closedAt;

    @Column(name = "a_status", length = 20)
    private String status;

    @Column(name = "a_balance", precision = 18, scale = 2)
    private BigDecimal balance;

    @Column(name = "a_currency", length = 3)
    private String currency;

    @Column(name = "a_nickname", length = 50)
    private String nickname;

    @Column(name = "a_last_tx_at")
    private LocalDateTime lastTxAt;

    @Column(name = "a_created_by", length = 20)
    private String createdBy;

    @Column(name = "a_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "a_agree_terms", length = 1)
    private String agreeTerms;

    @Column(name = "a_agree_privacy", length = 1)
    private String agreePrivacy;

    @Column(name = "a_agree_marketing", length = 1)
    private String agreeMarketing;

    @Column(name = "a_rate", precision = 6, scale = 4)
    private BigDecimal rate;

    // 비즈니스 메서드들
    public boolean isActive() {
        return "ACTIVE".equals(this.status);
    }

    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    public void deposit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
        this.lastTxAt = LocalDateTime.now();
    }

    public void withdraw(BigDecimal amount) {
        if (!hasSufficientBalance(amount)) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }
        this.balance = this.balance.subtract(amount);
        this.lastTxAt = LocalDateTime.now();
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void closeAccount() {
        this.status = "CLOSED";
        this.closedAt = LocalDateTime.now();
    }

    public String getDisplayName() {
        return nickname != null ? nickname : accountType;
    }
}