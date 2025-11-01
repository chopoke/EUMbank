package com.boot.eumbank.loan.dto.apply;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LoanConsentItemDTO {
    private String termCode;
    private String title;
    private String version;
    private String body;     // 전문(마크다운/텍스트)
    private boolean required;
    private boolean agreed;
    private String agreedAt; // ISO-8601
}

