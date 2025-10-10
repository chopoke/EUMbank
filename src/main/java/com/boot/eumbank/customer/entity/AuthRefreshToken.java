package com.boot.eumbank.customer.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(
        name = "AUTH_REFRESH_TOKEN",
        indexes = {
                @Index(name = "idx_art_cno", columnList = "c_no"),
                @Index(name = "idx_art_expires", columnList = "expires_at")
        }
)
public class AuthRefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rt_id")
    private Long rtId;

    @Column(name = "c_no", nullable = false)
    private Integer customerNo;                  // CUSTOMER_TBL.c_no

    @Column(name = "rt_hash", nullable = false, length = 64, unique = true)
    private String rtHash;                // refreshToken의 SHA-256

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "t_from", length = 64)
    private String tFrom;                 // 발급 사유(로그인/갱신)

    @Column(name = "t_next", length = 64)
    private String tNext;                 // 다음 단계(회전 등)

    @Column(name = "delete_at")
    private Instant deleteAt;             // 회수(로그아웃/강제만료) 시각

    @Column(name = "delete_reason", length = 100)
    private String deleteReason;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "last_used_ip", length = 45)
    private String lastUsedIp;

    @Column(name = "user_agent", length = 255)
    private String userAgent;
}
