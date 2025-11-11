package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "LOAN_CONSENT_TBL")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanConsent {

    // PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lc_no")
    private Long lcNo;

    // FK
    @Column(name = "la_no")
    private Long laNo;

    // 고객 NO
    @Column(name = "c_no", nullable = false)
    private Integer customerNo;

    // 약관 코드/제목/버전
    @Column(name = "term_code", nullable = false, length = 30)
    private String termCode;

    @Column(name = "term_title", nullable = false, length = 200)
    private String termTitle;

    // 주의: JPA @Version 아님! 그냥 문자열 컬럼
    @Column(name = "version", nullable = false, length = 20)
    private String version;

    // 본문 (MEDIUMTEXT)
    @Lob
    @Column(name = "body_md", columnDefinition = "MEDIUMTEXT", nullable = false)
    private String bodyMd;

    // 동의 여부 (TINYINT(1))
    @Column(name = "agreed", nullable = false)
    private boolean agreed;

    // 동의 시각 (NOT NULL)
    @Column(name = "agreed_at", nullable = false)
    private LocalDateTime agreedAt;

    // 본문 해시 (VARCHAR(64))
    @Column(name = "body_hash", length = 64)
    private String bodyHash;

    // 생성/수정 시각
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
