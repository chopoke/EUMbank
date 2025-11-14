package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.LoginRequest;
import com.boot.eumbank.customer.dto.SignupRequest;

public interface AuthService {
    void signup(SignupRequest req);
    // 로그인 → AT + RT 생성 + RT DB 저장
    AuthResponse login(LoginRequest req, String userAgent, String clientIp);
    // refresh → RT 유효성 검증 → 회전/AT 재발급
    AuthResponse refresh(String refreshToken, String userAgent, String clientIp);
    // 로그아웃 → 해당 RT 소프트 삭제
    void logout(String refreshToken, String reason);  // 선택: 단일 토큰 로그아웃

}
