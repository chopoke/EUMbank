package com.boot.eumbank.transfer_domain.transfer.exception;

/**
 * [자기 계좌 이체 예외]
 * - 출금 계좌와 입금 계좌가 동일할 때 발생
 */
public class SameAccountTransferException extends TransferException {
    
    public SameAccountTransferException() {
        super("SAME_ACCOUNT_TRANSFER", "자기 계좌로는 이체할 수 없습니다.");
    }
    
    public SameAccountTransferException(String accountNo) {
        super("SAME_ACCOUNT_TRANSFER", 
              String.format("자기 계좌로는 이체할 수 없습니다. (계좌: %s)", accountNo));
    }
}