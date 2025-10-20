package com.boot.eumbank.transfer_domain.transfer.exception;

import java.math.BigDecimal;

/**
 * [잔액 부족 예외]
 * - 계좌 잔액이 이체 금액보다 적을 때 발생
 */
public class InsufficientBalanceException extends TransferException {
    
    public InsufficientBalanceException(BigDecimal balance, Integer amount) {
        super("INSUFFICIENT_BALANCE", 
              String.format("잔액이 부족합니다. (현재 잔액: ₩%,d원, 이체 금액: ₩%,d원)", 
                           balance.intValue(), amount));
    }
    
    public InsufficientBalanceException(String message) {
        super("INSUFFICIENT_BALANCE", message);
    }
}

