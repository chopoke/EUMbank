package com.boot.eumbank.loan.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface LoanClock {
    LocalDate today();
    LocalDateTime now();
}
