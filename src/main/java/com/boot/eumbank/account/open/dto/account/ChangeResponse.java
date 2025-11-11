package com.boot.eumbank.account.open.dto.account;

import com.boot.eumbank.account.open.enums.PasswordChangeResult;
import com.boot.eumbank.account.open.enums.PinChangeResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeResponse {
    private boolean success;
    private String code;
    private String message;
    private Long timestamp;

    public static ChangeResponse of(PinChangeResult result) {
        return ChangeResponse.builder()
                .success(result.isSuccess())
                .code(result.getCode())
                .message(result.getMessage())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static ChangeResponse of(PasswordChangeResult result) {
        return ChangeResponse.builder()
                .success(result.isSuccess())
                .code(result.getCode())
                .message(result.getMessage())
                .timestamp(System.currentTimeMillis())
                .build();
    }
}