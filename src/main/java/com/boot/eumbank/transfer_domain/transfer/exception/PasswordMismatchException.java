package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [비밀번호 불일치 예외]
 * - 계좌 비밀번호가 일치하지 않을 때 발생
 */
public class PasswordMismatchException extends TransferException {
    
    public PasswordMismatchException() {
        super("PASSWORD_MISMATCH", "계좌 비밀번호가 올바르지 않습니다.");
    }
    
    public PasswordMismatchException(String accountNumber) {
        super("PASSWORD_MISMATCH", 
              String.format("계좌 비밀번호가 올바르지 않습니다. (계좌: %s)", accountNumber));
    }
}

