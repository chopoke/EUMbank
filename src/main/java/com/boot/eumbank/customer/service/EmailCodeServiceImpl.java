package com.boot.eumbank.customer.service;

import io.jsonwebtoken.io.Decoders;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;

@Service
public class EmailCodeServiceImpl implements EmailCodeService {

    @Value("${app.email.code.secret}")
    private String secretBase64;

    @Value("${app.email.code.exp-min:3}")
    private long expMin;

    @Value("${app.email.code.period-seconds:60}")
    private long periodSec;

    @Value("${app.email.code.clock-skew:1}")
    private int clockSkewWindows;

    private byte[] secretBytes;

    @PostConstruct
    void init() {
        try {
            secretBytes = Decoders.BASE64.decode(secretBase64);
        } catch (IllegalArgumentException ignore) {
            // Base64가 아니면 일반 문자열로 처리
            secretBytes = secretBase64.getBytes(StandardCharsets.UTF_8);
        }
    }

    @Override
    public String issueCode(String email) {
        String norm = normalize(email);
        long now = Instant.now().getEpochSecond();
        long window = now / periodSec; // 현재 윈도
        return codeFor(norm, window);
    }

    @Override
    public boolean verifyCode(String email, String code) {
        if (email == null || code == null) return false;
        String norm = normalize(email);
        String c = code.trim();

        long now = Instant.now().getEpochSecond();
        long current = now / periodSec;
        long maxWindow = expMin * 60 / periodSec; // 유효 시간 동안의 윈도 수

        // 시계 오차 허용: 앞/뒤 몇 윈도까지 허용
        long start = current - maxWindow - clockSkewWindows;
        long end   = current + clockSkewWindows;

        for (long w = start; w <= end; w++) {
            if (c.equals(codeFor(norm, w))) return true;
        }
        return false;
    }

    private String codeFor(String emailLower, long window) {
        try {
            String data = emailLower + ":" + window;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] h = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            // 동적 잘라내기 대신 간단/안전: 상위 4바이트 → 양수 → 6자리
            int val = ((h[0] & 0x7F) << 24) | ((h[1] & 0xFF) << 16) | ((h[2] & 0xFF) << 8) | (h[3] & 0xFF);
            int code = Math.floorMod(val, 1_000_000);
            return String.format("%06d", code);
        } catch (Exception e) {
            throw new IllegalStateException("코드 생성 실패", e);
        }
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
