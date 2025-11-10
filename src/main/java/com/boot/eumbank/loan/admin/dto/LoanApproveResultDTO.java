package com.boot.eumbank.loan.admin.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder @Data @AllArgsConstructor @NoArgsConstructor
public class LoanApproveResultDTO {

    private String laId;
    private Long loanNo;                     // loan_tbl PK
    private String loanAccountNo;            // 대출계좌번호(있다면)
    private LocalDateTime fundedAt;          // 실제 지급시각
    private String status;                   // FUNDED or APPROVED(지급대기)
}
