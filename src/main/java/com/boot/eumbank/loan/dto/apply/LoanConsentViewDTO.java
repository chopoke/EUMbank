package com.boot.eumbank.loan.dto.apply;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
@Data
@AllArgsConstructor
public class LoanConsentViewDTO {
    private String termCode;
    private String title;
    private String version;
    private String body;        // 동의 당시 약관 전문(스냅샷)
    private Boolean agreed;
    private LocalDateTime agreedAt;
}
