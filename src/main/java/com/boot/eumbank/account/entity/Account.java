package com.boot.eumbank.account.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@Entity
@Table(name = "ACCOUNT_TBL")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "a_no")
    private Integer no;

    @Column(name = "a_id", nullable = false, unique = true, length = 20)
    private String id;

    @Column(name = "c_no", nullable = false)
    private Integer customerId;

    @Column(name = "a_account_no", nullable = false, unique = true, length = 30)
    private String accountNo;

    @Column(name = "a_product_code", nullable = false, length = 30)
    private String productCode;

    @Column(name = "a_account_type", nullable = false, length = 20)
    private String accountType;

    @Column(name = "a_opened_at", nullable = false)
    private LocalDateTime openedAt = LocalDateTime.now();

    @Column(name = "a_account_pwd", nullable = false, length = 10)
    private String accountPwd;

    @Column(name = "a_status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "a_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    // VARCHAR(3) 기준 (columnDefinition 제거)
    @Column(name = "a_currency", nullable = false, length = 3)
    private String currency = "KRW";

    @Column(name = "a_nickname", length = 50)
    private String nickname;

    @Column(name = "a_agree_terms", nullable = false, length = 1)
    private String agreeTerms;

    @Column(name = "a_agree_privacy", nullable = false, length = 1)
    private String agreePrivacy;

    @Column(name = "a_agree_marketing", length = 1)
    private String agreeMarketing;

    @Column(name = "a_rate", precision = 6, scale = 4)
    private BigDecimal rate;
}
