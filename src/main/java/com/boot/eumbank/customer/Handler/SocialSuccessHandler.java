package com.boot.eumbank.customer.Handler;

import com.boot.eumbank.customer.dto.CustomOAuth2User;
import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.CookieUtil;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SocialSuccessHandler implements AuthenticationSuccessHandler {

    private final CookieUtil cookieUtil;
    private Logger logger = LoggerFactory.getLogger(SocialSuccessHandler.class);

    private final JwtTokenProvider jwt;
    private final CustomerRepo customers;
    private final AuthRefreshTokenRepo refreshTokens;

    @Transactional
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        logger.info("<<< SocialSuccessHandler onAuthenticationSuccess >>>");

        CustomOAuth2User principal = (CustomOAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = principal.getAttributes();

        Object needLink = attributes.get("need_link_confirmation");
        // 연동이 필요할 경우
        if(needLink != null && (needLink.equals(true) || "true".equalsIgnoreCase(needLink.toString()))) {
            Map<String, Object> payload = (Map<String, Object>) attributes.get("payload");

            String userId = payload.get("userId").toString();
            String email = payload.get("email").toString();
            String naverId = payload.get("naverId").toString();

            // 한글이 깨지지않게 전송
            String redirectUrl = String.format(
                    "http://localhost:3000/social/link?userId=%s&email=%s&naverId=%s",
                    URLEncoder.encode(userId, StandardCharsets.UTF_8),
                    URLEncoder.encode(email, StandardCharsets.UTF_8),
                    URLEncoder.encode(naverId, StandardCharsets.UTF_8)
            );

            response.sendRedirect(redirectUrl);
            return;
        }

        // 소셜 로그인을 한 경우
        String userId = authentication.getName();
        logger.info("userId : {}", userId);

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

        // refresh 토큰 DB 저장
        refreshTokens.save(row);

        cookieUtil.addHttpOnlyCookie(response,"rt", refresh, jwt.getRefreshTtlSec());

        response.sendRedirect("http://localhost:3000/social/cookie");

    }
}
