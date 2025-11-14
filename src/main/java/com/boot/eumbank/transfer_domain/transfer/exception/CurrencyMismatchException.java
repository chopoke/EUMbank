package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [통화 불일치 예외]
 * - 원화 계좌가 아닌 계좌로 이체 시도 시 발생
 * - 이체 기능은 원화 계좌만 사용 가능
 */
public class CurrencyMismatchException extends TransferException {
    
    public CurrencyMismatchException() {
        super("CURRENCY_MISMATCH", "이체는 원화 계좌만 사용 가능합니다.");
    }
    
    public CurrencyMismatchException(String accountNo, String currency) {
        super("CURRENCY_MISMATCH", 
              String.format("이체는 원화 계좌만 사용 가능합니다. (계좌: %s, 통화: %s)", accountNo, currency));
    }
    
    public CurrencyMismatchException(String message) {
        super("CURRENCY_MISMATCH", message);
    }
}

