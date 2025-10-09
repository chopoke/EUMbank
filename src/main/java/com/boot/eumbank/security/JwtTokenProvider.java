package com.boot.eumbank.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties props;
    private Key signingKey;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        // 비밀키 길이 검증: 최소 256bit(HMAC-SHA256) → 32바이트 이상 권장, 실제로는 64바이트 이상 추천
        byte[] keyBytes = props.getSecret().getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String createAccessToken(String userId) {
        long now = System.currentTimeMillis();
        long expMs = props.getAccessExpMin() * 60_000L;
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 필요시 리프레시 토큰도 같은 방식으로 */
    public String createRefreshToken(String userId) {
        long now = System.currentTimeMillis();
        long expMs = props.getRefreshExpDay() * 24L * 60L * 60L * 1000L;
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUserId(String token) {
        return Jwts.parserBuilder().setSigningKey(signingKey).build()
                .parseClaimsJws(token).getBody().getSubject();
    }
}
