package com.boot.eumbank.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "AUTH_REFRESH_TOKEN")
public class AuthRefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rt_id")
    private Long rtId;

    @Column(name = "c_no", nullable = false)
    private Integer cNo;

    @Column(name = "rt_hash", nullable = false, length = 64, unique = true)
    private String rtHash;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "t_from", length = 64)
    private String tFrom;

    @Column(name = "t_next", length = 64)
    private String tNext;

    @Column(name = "delete_at")
    private Instant deleteAt;

    @Column(name = "delete_reason", length = 100)
    private String deleteReason;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "last_used_ip", length = 45)
    private String lastUsedIp;

    @Column(name = "user_agent", length = 255)
    private String userAgent;
}
