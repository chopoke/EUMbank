package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [계좌 한도 정보 없음 예외]
 * - 계좌 한도 정보를 찾을 수 없을 때 발생
 */
public class AccountLimitNotFoundException extends TransferException {
    
    public AccountLimitNotFoundException() {
        super("ACCOUNT_LIMIT_NOT_FOUND", "계좌 한도 정보를 찾을 수 없습니다.");
    }
    
    public AccountLimitNotFoundException(String accountNo) {
        super("ACCOUNT_LIMIT_NOT_FOUND", 
              String.format("계좌 한도 정보를 찾을 수 없습니다. (계좌: %s)", accountNo));
    }
}