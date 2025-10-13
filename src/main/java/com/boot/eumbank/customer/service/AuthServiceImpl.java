package com.boot.eumbank.customer.service;

import com.boot.eumbank.customer.dto.AuthResponse;
import com.boot.eumbank.customer.dto.LoginRequest;
import com.boot.eumbank.customer.dto.SignupRequest;
import com.boot.eumbank.customer.entity.AuthRefreshToken;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.AuthRefreshTokenRepo;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.customer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final CustomerRepo customers;
    private final AuthRefreshTokenRepo refreshTokens;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    @Transactional
    @Override
    public void signup(SignupRequest req) {
        final String userId = req.getC_user_id().trim();
        final String rawPw  = req.getC_password().trim();
        final String nameKr = req.getC_name_kr().trim();
        final String email  = req.getC_email().trim();
        final String phone  = req.getC_phone_mobile().trim();

        if (customers.existsByUserId(userId)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // 약관 값 정규화 (대소문자/널 방지)
        String agreeTerms     = yn(req.getC_agree_terms(), "N");    // 미전송 시 N
        String agreePrivacy   = yn(req.getC_agree_privacy(), "N");  // 미전송 시 N
        String agreeMarketing = ynOrNull(req.getC_agree_marketing()); // 선택: null 허용

        // 필수 약관 미동의 시 차단 (선택)
        if (!"Y".equals(agreeTerms) || !"Y".equals(agreePrivacy)) {
            throw new IllegalArgumentException("필수 약관(이용약관/개인정보)에 동의해야 가입 가능합니다.");
        }

        Customer customer = Customer.builder()
                .userId(userId)                 // c_user_id
                .cId(userId)                    // 필요하면 임시 동일
                .cPassword(encoder.encode(rawPw))
                .cNameKr(nameKr)
                .cEmail(email)
                .cPhoneMobile(phone)
                .cNationalityCd("KOR")
                .cAuthLevel(1)
                .cRiskGrade("LOW")
                .cIsPep("N")
                .cIsSanctionHit("N")
                .cStatus("ACTIVE")
                .cCreatedAt(Instant.now())
                .cCreatedBy("SYSTEM")
                .cAgreeTerms(agreeTerms)
                .cAgreePrivacy(agreePrivacy)
                .cAgreeMarketing(agreeMarketing)
                .cLoginType("EUM")
                .build();

        customers.save(customer);
    }

    private String yn(String v, String def) {
        if (v == null || v.isBlank()) return def;
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }

    private String ynOrNull(String v) {
        if (v == null || v.isBlank()) return null;     // 선택 동의: 미체크면 NULL
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }

    @Transactional
    @Override
    public AuthResponse login(LoginRequest req, String userAgent, String clientIp) {
        final String userId = req.getC_user_id().trim();
        final String rawPw  = req.getC_password().trim();

        Customer customer = customers.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!encoder.matches(rawPw, customer.getCPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // 1) Access 발급
        String access = jwt.createAccessToken(userId);

        // 2) Refresh 발급 & 저장(해시)
        String refresh = jwt.createRefreshToken(userId);
        String refreshHash = sha256(refresh);

        Instant now = Instant.now();
        AuthRefreshToken row = new AuthRefreshToken();
        row.setCustomerNo(customer.getCustomerNo());                 // Integer 타입 맞춰서 사용
        row.setRtHash(refreshHash);
        row.setIssuedAt(now);
        row.setExpiresAt(jwt.getExpiryFromRefresh(refresh));
        row.setTFrom("LOGIN");
        row.setLastUsedAt(now);
        row.setLastUsedIp(clientIp);
        row.setUserAgent(userAgent);

        // 같은 사용자 오래된 토큰 정리 정책(선택): 10개 이상이면 전체 삭제
        if (refreshTokens.countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(customer.getCustomerNo(), now) >= 10) {
            refreshTokens.deleteByCustomerNo(customer.getCustomerNo());
        }

        refreshTokens.save(row);

        return AuthResponse.builder()
                .accessToken(access)
                .tokenType("Bearer")
                .refreshToken(refresh)
                .build();
    }

    @Transactional
    @Override
    public AuthResponse refresh(String refreshToken, String userAgent, String clientIp) {
        // 1) JWT 서명/만료 검증
        if (!jwt.validateRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }
        String subjectUserId = jwt.getSubjectFromRefresh(refreshToken);
        Instant tokenExp = jwt.getExpiryFromRefresh(refreshToken);

        // 2) DB에서 해시 매칭(회수되지 않은 토큰이어야 함)
        String hash = sha256(refreshToken);
        AuthRefreshToken saved = refreshTokens.findByRtHashAndDeleteAtIsNull(hash)
                .orElseThrow(() -> new IllegalArgumentException("토큰이 존재하지 않거나 이미 만료/회수되었습니다."));

        // 3) 만료 체크(서명 OK라도 서버 정책상 만료 또는 회수되었을 수 있음)
        if (saved.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("토큰이 만료되었습니다. 다시 로그인하세요.");
        }

        // 4) subject → 사용자 조회
        Customer customer = customers.findByUserId(subjectUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 5) 토큰 회전(rotate): 기존 토큰 회수 후 새 Refresh 발급
        saved.setDeleteAt(Instant.now());
        saved.setDeleteReason("ROTATE");
        refreshTokens.save(saved);

        String newAccess = jwt.createAccessToken(subjectUserId);
        String newRefresh = jwt.createRefreshToken(subjectUserId);
        String newHash = sha256(newRefresh);

        AuthRefreshToken rotated = new AuthRefreshToken();
        rotated.setCustomerNo(customer.getCustomerNo());
        rotated.setRtHash(newHash);
        rotated.setIssuedAt(Instant.now());
        rotated.setExpiresAt(jwt.getExpiryFromRefresh(newRefresh));
        rotated.setTFrom("REFRESH");
        rotated.setLastUsedAt(Instant.now());
        rotated.setLastUsedIp(clientIp);
        rotated.setUserAgent(userAgent);
        refreshTokens.save(rotated);

        return AuthResponse.builder()
                .accessToken(newAccess)
                .tokenType("Bearer")
                .refreshToken(newRefresh)
                .build();
    }

    @Transactional
    @Override
    public void logout(String refreshToken) {
        String hash = sha256(refreshToken);
        refreshTokens.findByRtHashAndDeleteAtIsNull(hash).ifPresent(row -> {
            row.setDeleteAt(Instant.now());
            row.setDeleteReason("LOGOUT");
            refreshTokens.save(row);
        });
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
