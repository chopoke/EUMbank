package com.boot.eumbank.customer.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Service
class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final CustomerService customerService;
    private final EmailCodeService emailCodeService;  // ← 여기!

    EmailServiceImpl(JavaMailSender mailSender,
                     CustomerService customerService,
                     EmailCodeService emailCodeService) {
        this.mailSender = mailSender;
        this.customerService = customerService;
        this.emailCodeService = emailCodeService;
    }

    @Override
    public void sendCode(String toEmail) {
        String email = norm(toEmail);
        if (!StringUtils.hasText(email)) throw new IllegalArgumentException("EMAIL_REQUIRED");

        // 이미 가입된 이메일이면 전송하지 않음
        if (customerService.emailExists(email)) {
            throw new IllegalStateException("USED_EMAIL_DB");
        }

        // 6자리 코드 생성(무상태)
        String code = emailCodeService.issueCode(email);

        // 메일 발송
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("[EUMbank] 이메일 인증 코드");
        msg.setText("인증 코드: " + code + "\n유효시간: 3분");
        mailSender.send(msg);
    }

    @Override
    public boolean verify(String email, String code) {
        String e = norm(email);
        String c = code == null ? "" : code.trim();
        if (!StringUtils.hasText(e) || !StringUtils.hasText(c)) return false;
        return emailCodeService.verifyCode(e, c);
    }

    private String norm(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
