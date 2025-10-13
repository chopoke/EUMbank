package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.LoginRequest;
import com.boot.eumbank.customer.dto.SignupRequest;

public interface AuthService {
    void signup(SignupRequest req);
    AuthResponse login(LoginRequest req, String userAgent, String clientIp);
    AuthResponse refresh(String refreshToken, String userAgent, String clientIp);
    void logout(String refreshToken);  // 선택: 단일 토큰 로그아웃
}
