package com.boot.eumbank.loan.dto.apply;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder @AllArgsConstructor @RequiredArgsConstructor
public class LoanApplicationResponseDTO {
    private String laId;
    private String status;
    private Long laNo;
    private LocalDateTime submittedAt;
}
