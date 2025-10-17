package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [금액 유효성 예외]
 * - 이체 금액이 유효하지 않을 때 발생
 */
public class InvalidAmountException extends TransferException {
    
    public InvalidAmountException(String message) {
        super("INVALID_AMOUNT", message);
    }
    
    public InvalidAmountException(Integer amount) {
        super("INVALID_AMOUNT", 
              String.format("유효하지 않은 이체 금액입니다: %d원", amount));
    }
}