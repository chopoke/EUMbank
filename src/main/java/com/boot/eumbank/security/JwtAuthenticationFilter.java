// src/main/java/com/boot/eumbank/security/JwtAuthenticationFilter.java
package com.boot.eumbank.security;

import com.boot.eumbank.repo.CustomerRepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;     // validate(String), getUserId(String)
    private final CustomerRepo customers;   // findByUserId(String)

    /** 회원가입/로그인/헬스체크/프리플라이트는 전부 인증 검사 스킵 */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) return true;
        if (path == null) return false;

        // 가장 넓게: "/api/auth/**", "/auth/**", "/**/auth/**", "/**/signup", "/**/login", "/actuator/health"
        return path.startsWith("/api/auth/")
                || path.startsWith("/auth/")
                || path.contains("/auth/")
                || path.endsWith("/signup")
                || path.endsWith("/login")
                || "/actuator/health".equals(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // 이미 인증되어 있으면 패스
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(req, res);
            return;
        }

        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwt.validate(token)) {
                String userId = jwt.getUserId(token); // 토큰에서 userId 추출

                customers.findByUserId(userId).ifPresent(c -> {
                    var auth = new UsernamePasswordAuthenticationToken(c, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }

        chain.doFilter(req, res);
    }
}
