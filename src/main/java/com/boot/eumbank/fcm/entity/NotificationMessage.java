package com.boot.eumbank.fcm.entity;

import com.boot.eumbank.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 알림 메시지 엔티티
 * 
 * <p>헤더의 "종 모양 아이콘"을 클릭했을 때 보여줄 알림 내역을 저장합니다.</p>
 * <p>이체 완료 등 다양한 이벤트에서 생성될 수 있습니다.</p>
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Entity
@Table(name = "notification_message_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMessage {

    /**
     * 메시지 고유 ID (PK)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    /**
     * 알림을 수신한 고객 (N:1 연관관계)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    /**
     * 알림 제목
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * 알림 본문
     */
    @Column(name = "body", nullable = false, length = 1000)
    private String body;

    /**
     * 클릭 시 이동할 URL
     */
    @Column(name = "click_action_url")
    private String clickActionUrl;

    /**
     * 읽음 여부 ("on" 또는 "off")
     */
    @Column(name = "is_read", nullable = false, length = 3)
    @Builder.Default
    private String isRead = "off";

    /**
     * 생성 일시 (수정 불가)
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

