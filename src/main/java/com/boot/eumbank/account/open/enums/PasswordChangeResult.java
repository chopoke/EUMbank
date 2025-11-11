package com.boot.eumbank.account.open.enums;

import lombok.Getter;

@Getter
public enum PasswordChangeResult {
    SUCCESS("SUCCESS", "PASSWORD이 성공적으로 변경되었습니다.", 200),
    DUPLICATE_PASSWORD("DUPLICATE_PASSWORD", "새로운 PIN이 현재 PIN과 동일합니다.", 400),
    INVALID_FORMAT("INVALID_FORMAT", "PIN은 6자리 숫자여야 합니다.", 400),
    CUSTOMER_NOT_FOUND("CUSTOMER_NOT_FOUND", "고객 정보를 찾을 수 없습니다.", 404),
    UPDATE_FAILED("UPDATE_FAILED", "PIN 변경에 실패했습니다.", 500),
    ERROR("ERROR", "시스템 오류가 발생했습니다.", 500);

    private final String code;
    private final String message;
    private final int httpStatus;

    PasswordChangeResult(String code, String message, int httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public boolean isSuccess() {
        return this == SUCCESS;
    }
}