// src/main/java/com/boot/eumbank/mypage/projection/LoanApplicationRow.java
package com.boot.eumbank.mypage.projection;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface LoanApplicationRow {
    Long getLaNo();
    String getProductName();
    BigDecimal getApplAmount();
    String getStatus();
    LocalDateTime getSubmittedAt();
}
