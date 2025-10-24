package com.boot.eumbank.customer.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class SignupRequest {
    @NotBlank @Size(min = 6, max = 20)
    private String c_user_id;

    @NotBlank @Size(min = 8, max = 32)
    private String c_password;

    @NotBlank
    private String c_name_kr;

    @NotBlank @Email
    private String c_email;

    @NotBlank
    private String c_phone_mobile;

    // 이메일 인증 코드 - 검증에만 사용
    @NotBlank
    private String emailCode;

    @NotNull
    private LocalDate c_birth_dt;

    private String c_agree_terms;
    private String c_agree_privacy;
    private String c_agree_marketing;

    private String c_login_type;
}
