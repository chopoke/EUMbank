package com.boot.eumbank.customer.security;

import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Component
@RequiredArgsConstructor
public class RefreshAuthFilter extends OncePerRequestFilter {

    private final AuthRefreshTokenRepo refreshRepo;
    private final CustomerRepo customerRepo;
    private final JwtTokenProvider jwt;
    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String rt = cookieUtil.getRefreshCookie(req).orElse(null);
            if (rt != null) {
                String hash = sha256(rt);
                Optional<AuthRefreshToken> token = refreshRepo.findByRtHashAndDeleteAtIsNull(hash);
                if (token.isPresent()
                        && token.get().getExpiresAt() != null
                        && token.get().getExpiresAt().isAfter(Instant.now())) {

                    Integer cNo = token.get().getCustomerNo();
                    Optional<Customer> customerOpt = customerRepo.findById(cNo);
                    if (customerOpt.isPresent()) {
                        Customer principal = customerOpt.get();

                        // 권한 직접 구성 (Customer 엔티티의 필드명에 맞게 수정)
                        String role = principal.getRole() != null ? principal.getRole() : "USER";
                        if (!role.startsWith("ROLE_")) role = "ROLE_" + role;
                        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

                        var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                        SecurityContextHolder.getContext().setAuthentication(auth);

                        // 필요 시 관리자 XHR용 초단기 AT 발급
                        String ephemeralAT = jwt.createAccessToken(principal.getUserId());
                        req.setAttribute("ephemeralAT", ephemeralAT);
                    }
                }
            }
        }
        chain.doFilter(req, res);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/admin/");
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception e) {
            throw new IllegalStateException("해시 계산 실패", e);
        }
    }
}
