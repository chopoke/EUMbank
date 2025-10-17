package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [계좌 상태 예외]
 * - 계좌가 이체 불가능한 상태일 때 발생
 */
public class AccountStatusException extends TransferException {
    
    public AccountStatusException(String message) {
        super("ACCOUNT_STATUS_ERROR", message);
    }
    
    public AccountStatusException(String accountNo, String status) {
        super("ACCOUNT_STATUS_ERROR", 
              String.format("계좌가 이체 불가능한 상태입니다. (계좌: %s, 상태: %s)", 
                           accountNo, status));
    }
}