package com.boot.eumbank.fcm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FCM 구독 요청 DTO
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FcmSubscribeRequestDto {

    @NotBlank(message = "FCM 토큰은 필수입니다.")
    private String fcmToken;

    private String deviceInfo;
}

