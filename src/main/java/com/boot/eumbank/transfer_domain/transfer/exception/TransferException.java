package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [이체 예외 기본 클래스]
 * - 모든 이체 관련 예외의 부모 클래스
 * - 공통적인 예외 처리 로직 제공
 */
public class TransferException extends RuntimeException {
    
    private final String errorCode;
    
    public TransferException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public TransferException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}