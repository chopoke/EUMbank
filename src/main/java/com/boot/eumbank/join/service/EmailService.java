package com.boot.eumbank.join.service;

import com.boot.eumbank.join.verification.store.VerifyCodeStore;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final VerifyCodeStore codeStore;
    private final CustomerService customerService;   // DB 중복확인용
    private final SecureRandom rnd = new SecureRandom();

    public EmailService(
            JavaMailSender mailSender,
            VerifyCodeStore codeStore,
            CustomerService customerService
    ) {
        this.mailSender = mailSender;
        this.codeStore = codeStore;
        this.customerService = customerService;
    }

    /**
     * 인증코드 전송
     * - 전송 전 DB에 이미 가입된 이메일인지 검사 (대/소문자 무시)
     * - 이미 가입된 이메일이면 코드 전송하지 않고 "USED_EMAIL_DB" 예외
     */
    public void sendCode(String toEmail) {
        String email = norm(toEmail);
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("EMAIL_REQUIRED");
        }

        // DB 중복 체크 (이미 가입된 이메일이면 차단)
        if (customerService.emailExists(email)) {
            throw new IllegalStateException("USED_EMAIL_DB");
        }

        // 재사용/만료 관리는 VerifyCodeStore가 담당
        String code = String.format("%06d", rnd.nextInt(1_000_000));
        codeStore.put(email, code);

        // 메일 발송
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("[EUMbank] 이메일 인증 코드");
        msg.setText("인증 코드: " + code + "\n유효시간: 15분");
        mailSender.send(msg);
    }

    /**
     * 인증코드 검증
     */
    public boolean verify(String email, String code) {
        String e = norm(email);
        String c = code == null ? "" : code.trim();
        if (!StringUtils.hasText(e) || !StringUtils.hasText(c)) return false;
        return codeStore.verify(e, c);
    }

    private String norm(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
