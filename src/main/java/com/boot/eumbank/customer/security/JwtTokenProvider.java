package com.boot.eumbank.customer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final Key accessKey;
    private final Key refreshKey;

    // 초 단위 만료시간 (예: 30분, 7일)
    private final long accessTtlSec;
    private final long refreshTtlSec;

    public JwtTokenProvider(
            @Value("${jwt.access.secret}") String accessSecret,
            @Value("${jwt.refresh.secret}") String refreshSecret,
            @Value("${jwt.access.ttl-seconds:1800}") long accessTtlSec,
            @Value("${jwt.refresh.ttl-seconds:604800}") long refreshTtlSec
    ) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSec = accessTtlSec;
        this.refreshTtlSec = refreshTtlSec;
    }

    public String createAccessToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(accessTtlSec)))
                .signWith(accessKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(refreshTtlSec)))
                .signWith(refreshKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateRefreshToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(refreshKey).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getSubjectFromRefresh(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(refreshKey).build()
                .parseClaimsJws(token).getBody();
        return c.getSubject();
    }

    public Instant getExpiryFromRefresh(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(refreshKey).build()
                .parseClaimsJws(token).getBody();
        return c.getExpiration().toInstant();
    }

    public boolean validateAccessToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(accessKey).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUserIdFromAccess(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(accessKey).build()
                .parseClaimsJws(token).getBody();
        return c.getSubject(); // subject에 userId 넣었으므로 그대로 반환
    }
}
