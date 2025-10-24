package com.boot.eumbank.customer.service;

public interface EmailCodeService {
    /** 6자리 코드 생성(Stateless) */
    String issueCode(String email);

    /** 코드 검증: true면 유효 */
    boolean verifyCode(String email, String code);
}
