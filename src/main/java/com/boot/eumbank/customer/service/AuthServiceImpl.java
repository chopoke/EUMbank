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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;

@Slf4j
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
        final LocalDate birthDt = req.getC_birth_dt();

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
                .email(email)
                .cPhoneMobile(phone)
                .cBirthDt(birthDt)
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
                .loginType("EUM")
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
        var c = customers.findByUserId(req.getC_user_id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid id/password"));

        if (!encoder.matches(req.getC_password(), c.getCPassword()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid id/password");

        String at = jwt.createAccessToken(c.getUserId());
        String rt = jwt.createRefreshToken(c.getUserId());
        String rtHash = sha256(rt);

        var now = Instant.now();
        var art = new AuthRefreshToken();
        art.setCustomerNo(c.getCustomerNo());
        art.setRtHash(rtHash);
        art.setIssuedAt(now);
        art.setExpiresAt(jwt.getExpiryFromRefresh(rt));
        art.setDeviceId(userAgent);
        refreshTokens.save(art);

        return new AuthResponse("Bearer", at, "login ok", rt); // 컨트롤러에서 rt는 쿠키로만 사용

    }

    @Transactional
    @Override
    public AuthResponse refresh(String refreshToken, String userAgent, String clientIp) {
        log.info("[REFRESH] raw RT={}", refreshToken);
        log.info("[REFRESH] RT hash={}", sha256(refreshToken));
        if (refreshToken == null || refreshToken.isBlank())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "missing rt");

        String hash = sha256(refreshToken);
        var t = refreshTokens.findByRtHashAndDeleteAtIsNull(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "rt not found"));

        if (t.getExpiresAt() == null || t.getExpiresAt().isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "rt expired");

        // 회전: 기존 RT 소프트 삭제
        t.setDeleteAt(Instant.now());
        t.setDeleteReason("rotated");
        refreshTokens.save(t);

        // 새 RT + AT 발급
        var userId = jwt.getSubjectFromRefresh(refreshToken);
        String newAT = jwt.createAccessToken(userId);
        String newRT = jwt.createRefreshToken(userId);
        String newHash = sha256(newRT);

        var now = Instant.now();
        var nt = new AuthRefreshToken();
        nt.setCustomerNo(t.getCustomerNo());
        nt.setRtHash(newHash);
        nt.setIssuedAt(now);
        nt.setExpiresAt(jwt.getExpiryFromRefresh(newRT));
        nt.setDeviceId(userAgent);
        // t_from/t_next 쓰면 여기 연결
        refreshTokens.save(nt);

        return new AuthResponse("Bearer", newAT, "refreshed", newRT);
    }

    @Transactional
    @Override
    public void logout(String refreshToken, String reason) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        String hash = sha256(refreshToken);
        refreshTokens.findByRtHashAndDeleteAtIsNull(hash).ifPresent(t -> {
            t.setDeleteAt(Instant.now());
            t.setDeleteReason(reason != null ? reason : "logout");
            refreshTokens.save(t);
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
