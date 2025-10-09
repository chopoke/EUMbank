package com.boot.eumbank.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {
    @NotBlank
    private String c_user_id;

    @NotBlank
    private String c_password;
}
