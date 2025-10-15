package com.boot.eumbank.customer.Handler;

import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;


@Component
@RequiredArgsConstructor
public class SocialSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwt;
    private final CustomerRepo customers;
    private final AuthRefreshTokenRepo refreshTokens;

    @Transactional
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        System.out.println("<<< SocialSuccessHandler onAuthenticationSuccess >>>");

        String userId = authentication.getName();

        System.out.println("userId : " + userId);

        String refresh = jwt.createRefreshToken(userId);
        String refreshHash;

        try {
            MessageDigest  md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(refresh.getBytes(StandardCharsets.UTF_8));
            refreshHash = HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("해시 계산 실패", e);
        }

        Optional<Customer> customer = customers.findByUserIdAndLoginType(userId, "NAVER");
        //Optional<Customer> customer = customers.findByUserIdAndLoginType(userId, "GOOGLE");

        String userAgent = request.getHeader("User-Agent");
        String xff = request.getHeader("X-Forwarded-For");
        String clientIp;
        if (xff != null && !xff.isBlank()) {
            clientIp = xff.split(",")[0].trim();
        } else {
            clientIp = request.getRemoteAddr();
        }

        Instant now = Instant.now();
        AuthRefreshToken row = new AuthRefreshToken();
        row.setCustomerNo(customer.get().getCustomerNo());
        row.setRtHash(refreshHash);
        row.setIssuedAt(now);
        row.setExpiresAt(jwt.getExpiryFromRefresh(refresh));
        row.setTFrom("LOGIN");
        row.setLastUsedAt(now);
        row.setLastUsedIp(clientIp);
        row.setUserAgent(userAgent);

        // 같은 사용자 오래된 토큰 정리 정책(선택): 10개 이상이면 전체 삭제
        if (refreshTokens.countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(customer.get().getCustomerNo(), now) >= 10) {
            refreshTokens.markAllDeletedByCustomer(customer.get().getCustomerNo(),Instant.now(),"TOO_MANY_TOKENS");
        }

        // refresh 토큰 DB 저장
        refreshTokens.save(row);

        Cookie refreshCookie = new Cookie("refreshToken", refresh);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(10);

        response.addCookie(refreshCookie);
        response.sendRedirect("http://localhost:3000/cookie");

    }
}
