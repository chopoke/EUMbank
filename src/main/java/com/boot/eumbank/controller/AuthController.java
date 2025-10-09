package com.boot.eumbank.controller;

import com.boot.eumbank.dto.AuthResponse;
import com.boot.eumbank.dto.LoginRequest;
import com.boot.eumbank.dto.SignupRequest;
import com.boot.eumbank.service.AuthService;
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
        return authService.login(req, ua);
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
