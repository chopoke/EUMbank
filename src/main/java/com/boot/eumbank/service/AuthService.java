package com.boot.eumbank.service;

import com.boot.eumbank.dto.AuthResponse;
import com.boot.eumbank.dto.LoginRequest;
import com.boot.eumbank.dto.SignupRequest;

public interface AuthService {
    void signup(SignupRequest req);
    AuthResponse login(LoginRequest req, String userAgent);
}
