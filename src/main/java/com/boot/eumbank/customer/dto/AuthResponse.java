package com.boot.eumbank.customer.dto;

import lombok.*;

@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {
    @Builder.Default
    private String tokenType = "Bearer";
    private String accessToken;
    private String message;
    private String refreshToken;
}