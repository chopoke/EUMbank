package com.boot.eumbank.fcm.entity;

import com.boot.eumbank.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * FCM 토큰 엔티티
 * 
 * <p>고객별 FCM 디바이스 토큰을 저장합니다.</p>
 * <p>한 고객이 여러 기기를 사용할 수 있도록 1:N 관계로 설계되었습니다.</p>
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Entity
@Table(name = "fcm_token_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FcmToken {

    /**
     * 토큰 고유 ID (PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long tokenId;

    /**
     * 고객 정보 (N:1 연관관계)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    /**
     * FCM 디바이스 토큰 (고유)
     */
    @Column(name = "fcm_token", nullable = false, unique = true, length = 500)
    private String fcmToken;

    /**
     * 디바이스 정보
     */
    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    /**
     * 알림 수신 동의 여부 ("on" 또는 "off")
     */
    @Column(name = "is_subscribed", nullable = false, length = 3)
    @Builder.Default
    private String isSubscribed = "off";

    /**
     * 생성 일시
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
