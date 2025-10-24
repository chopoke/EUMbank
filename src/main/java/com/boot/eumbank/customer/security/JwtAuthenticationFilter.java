// src/main/java/com/boot/eumbank/security/JwtAuthenticationFilter.java
package com.boot.eumbank.customer.security;

import com.boot.eumbank.customer.repo.CustomerRepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    private final JwtTokenProvider jwt;     // validateAccessToken(...), getUserIdFromAccess(...)
    private final CustomerRepo customers;   // findByUserId(String)
//    private final UserDetailsService userDetailsService;

    /** 회원가입/로그인/헬스체크/프리플라이트는 전부 인증 검사 스킵 */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
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

            if (jwt.validateAccessToken(token)) {
                String userId = jwt.getUserIdFromAccess(token); // 토큰에서 userId(subject) 추출

                customers.findByUserId(userId).ifPresent(c -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            c,                       // Principal (원하면 UserDetails로 교체 가능)
                            null,                    // Credentials
                            List.of()                // 권한(필요 시 매핑)
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }

        chain.doFilter(req, res);
    }
}
