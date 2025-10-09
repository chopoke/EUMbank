package com.boot.eumbank.service;

import com.boot.eumbank.dto.AuthResponse;
import com.boot.eumbank.dto.LoginRequest;
import com.boot.eumbank.dto.SignupRequest;
import com.boot.eumbank.entity.Customer;
import com.boot.eumbank.repo.CustomerRepo;
import com.boot.eumbank.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final CustomerRepo customers;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    @Transactional
    @Override
    public void signup(SignupRequest req) {
        // 입력값 정리
        final String userId = req.getC_user_id().trim();
        final String rawPw  = req.getC_password().trim();
        final String nameKr = req.getC_name_kr().trim();
        final String email  = req.getC_email().trim();
        final String phone  = req.getC_phone_mobile().trim();

        // 중복 체크
        if (customers.existsByUserId(userId)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        // ⚠️ Lombok @Builder는 필드 초기값을 그대로 반영하지 않습니다.
        // => NOT NULL 컬럼은 여기서 명시적으로 세팅하세요.
        Customer customer = Customer.builder()
                .userId(userId)                 // c_user_id
                .cId(userId)                    // c_id (NOT NULL이면 임시로 동일값 사용)
                .cPassword(encoder.encode(rawPw))
                .cNameKr(nameKr)
                .cEmail(email)
                .cPhoneMobile(phone)
                // --- NOT NULL 안전값들 명시 ---
                .cNationalityCd("KOR")
                .cAuthLevel(1)
                .cRiskGrade("LOW")
                .cIsPep("N")
                .cIsSanctionHit("N")
                .cStatus("ACTIVE")
                .cCreatedAt(Instant.now())
                .cCreatedBy("SYSTEM")
                // .cUpdatedAt(null) // 필요 시
                // .cUpdatedBy(null) // 필요 시
                .build();

        customers.save(customer);
    }

    @Override
    public AuthResponse login(LoginRequest req, String userAgent) {
        final String userId = req.getC_user_id().trim();
        final String rawPw  = req.getC_password().trim();

        var customer = customers.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!encoder.matches(rawPw, customer.getCPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // 필요 시 userAgent 로깅/저장
        // log.info("login ua={}", userAgent);

        String access = jwt.createAccessToken(userId); // 토큰 클레임에 userId 사용
        return new AuthResponse(access, "Bearer", null);     // 빌더 대신 생성자 사용(안전)
    }
}
