package com.boot.eumbank.fcm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 알림 메시지 응답 DTO
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessageDto {

    private Long messageId;
    private String title;
    private String body;
    private String clickActionUrl;
    private String isRead;
    private LocalDateTime createdAt;
}

