package com.boot.eumbank.customer.controller;

import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.LoginRequest;
import com.boot.eumbank.customer.dto.RefreshRequest;
import com.boot.eumbank.customer.dto.SignupRequest;
import com.boot.eumbank.customer.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = clientIp(httpReq);
        return authService.login(req, ua, ip);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req, HttpServletRequest httpReq) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = clientIp(httpReq);
        return authService.refresh(req.getRefreshToken(), ua, ip);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshRequest req) {
        authService.logout(req.getRefreshToken());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/health")
    public String health() { return "OK"; }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
