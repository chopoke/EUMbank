package com.boot.eumbank.loan.admin.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class LoanRejectComDTO {
    private String reason;                   // 반려 사유 (사용자에게 노출)
    private String memo;                     // 내부 메모(옵션)
}
