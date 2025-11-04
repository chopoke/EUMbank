package com.boot.eumbank.bill.port;

import java.math.BigDecimal;

public interface AccountDebitPort {
    BigDecimal debit(Integer aNo, BigDecimal amount);
}
