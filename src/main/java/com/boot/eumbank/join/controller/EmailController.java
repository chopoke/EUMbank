// src/main/java/com/boot/eumbank/join/controller/EmailController.java
package com.boot.eumbank.join.controller;

import com.boot.eumbank.join.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /** 인증코드 전송 */
    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody Map<String, String> body) {
        String email = body == null ? null : body.get("email");
        try {
            emailService.sendCode(email);
            return ResponseEntity.ok(Map.of("message", "sent"));
        } catch (IllegalArgumentException e) {
            // EMAIL_REQUIRED 등 입력 누락
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "INVALID_REQUEST", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            // DB 중복 (USED_EMAIL_DB) 또는 기타 상태 예외
            if ("USED_EMAIL_DB".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "USED_EMAIL", "message", "이미 가입된 이메일입니다."));
            }
            // 그 외 상태 예외는 400으로 처리
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_STATE", "message", e.getMessage()));
        }
    }

    /** 인증코드 검증 */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        String email = body == null ? null : body.get("email");
        String code  = body == null ? null : body.get("code");

        boolean ok = emailService.verify(email, code);
        return ResponseEntity.ok(Map.of("verified", ok));
    }

    @GetMapping("/ping")
    public String ping() { return "ok"; }
}
