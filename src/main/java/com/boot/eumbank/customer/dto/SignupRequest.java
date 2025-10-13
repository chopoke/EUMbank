package com.boot.eumbank.customer.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SignupRequest {
    @NotBlank @Size(min = 4, max = 50)
    private String c_user_id;

    @NotBlank @Size(min = 8, max = 100)
    private String c_password;

    @NotBlank
    private String c_name_kr;

    @NotBlank @Email
    private String c_email;

    @NotBlank
    private String c_phone_mobile;

    private String c_agree_terms;
    private String c_agree_privacy;
    private String c_agree_marketing;

    private String c_login_type;
}
