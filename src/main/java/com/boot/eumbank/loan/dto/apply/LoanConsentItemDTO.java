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
    private String version;
    private boolean required;
    private boolean agreed;
    private String agreedAt; // ISO string
}

