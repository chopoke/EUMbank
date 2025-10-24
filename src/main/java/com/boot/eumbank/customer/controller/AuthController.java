package com.boot.eumbank.customer.controller;

import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.LoginRequest;
import com.boot.eumbank.customer.dto.SignupRequest;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.CookieUtil;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import com.boot.eumbank.customer.service.AuthService;
import com.boot.eumbank.customer.service.SocialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String RT_COOKIE = "rt";
    private final AuthService authService;
    private final SocialService socialService;
    private final CookieUtil cookie;
    private final JwtTokenProvider jwt;
    private final CustomerRepo customerRepo;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check-username")
    public Map<String, Boolean> checkUsername(@RequestParam("userId") String userId) {
        boolean exists = customerRepo.existsByUserId(userId);
        return Map.of("available", !exists); // 200 {available:true|false}
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req,
                              HttpServletRequest httpReq,
                              HttpServletResponse httpRes) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = clientIp(httpReq);

        AuthResponse ar = authService.login(req, ua, ip);

        // RT를 httpOnly 쿠키로 세팅
        cookie.addHttpOnlyCookie(httpRes, RT_COOKIE, ar.getRefreshToken(),
                jwt.getRefreshTtlSec()); // getRtMaxAgeSeconds() 추가해도 되고 고정값 사용해도 됨

        // 응답에는 AT만 반환
        ar.setRefreshToken(null);
        return ar;
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest httpReq, HttpServletResponse httpRes) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = clientIp(httpReq);
        String rt = cookie.getRefreshCookie(httpReq).orElse(null);

        if (rt == null || rt.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // RT 없음 → 401
        }

        try {
            AuthResponse ar = authService.refresh(rt, ua, ip); // 서비스는 그대로 사용(이미 401 던짐)
            cookie.addRefreshCookie(httpRes, ar.getRefreshToken(), jwt.getRefreshTtlSec()); // 새 RT 쿠키
            ar.setRefreshToken(null); // 바디에서 RT 제거
            return ResponseEntity.ok(ar);
        } catch (Exception e) {
            // 만료/회전/불일치 등 모든 실패를 401로 고정
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpReq, HttpServletResponse httpRes,
                       @RequestParam(required = false) String reason) {
        String rt = cookie.getRefreshCookie(httpReq).orElse(null);
        authService.logout(rt, reason);
        cookie.deleteRefreshCookie(httpRes);
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

//    @PostMapping("/exchange")
//    public AuthResponse exchange(HttpServletRequest request, HttpServletResponse response) {
//        AuthResponse auth = socialService.refreshRotate(request, response);
//        cookie.addHttpOnlyCookie(response, RT_COOKIE, auth.getRefreshToken(), jwt.getRefreshTtlSec());
//        auth.setRefreshToken(null);
//        System.out.println(auth.getRefreshToken());
//        System.out.println(auth.getAccessToken());
//        return auth;
//    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> handleIAE(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}

