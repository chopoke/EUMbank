package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [계좌 없음 예외]
 * - 요청한 계좌를 찾을 수 없을 때 발생
 */
public class AccountNotFoundException extends TransferException {
    
    public AccountNotFoundException() {
        super("ACCOUNT_NOT_FOUND", "계좌를 찾을 수 없습니다.");
    }
    
    public AccountNotFoundException(String accountNo) {
        super("ACCOUNT_NOT_FOUND", 
              String.format("계좌를 찾을 수 없습니다. (계좌: %s)", accountNo));
    }
}