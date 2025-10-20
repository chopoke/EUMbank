package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [인증 실패 예외]
 * - JWT 인증 실패 또는 본인 계좌가 아닌 경우 발생
 */
public class UnauthorizedException extends TransferException {
    
    public UnauthorizedException() {
        super("UNAUTHORIZED", "인증이 필요합니다.");
    }
    
    public UnauthorizedException(String message) {
        super("UNAUTHORIZED", message);
    }
}