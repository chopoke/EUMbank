// src/main/java/com/boot/eumbank/mypage/projection/LoanRow.java
package com.boot.eumbank.mypage.projection;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface LoanRow {
    Long getLNo();
    String getProductName();
    BigDecimal getPrincipalAmount();
    BigDecimal getInterestRate();
    Integer getTermMonth();
    LocalDateTime getStartDate();
    LocalDateTime getMaturityDate();
    Integer getPayDay();
    String getStatus();
}
