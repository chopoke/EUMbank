package com.boot.eumbank.bill.port;

import java.math.BigDecimal;

public interface AccountLedgerPort {
    void recordDebit(Integer aNo, BigDecimal amount, BigDecimal balanceAfter,
                     String transferId, String transferType, String memo);
}
