package com.boot.eumbank.loan.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanApproveComDTO {
    private BigDecimal approvedAmount;      // 확정 대출금
    private Integer approvedTerm;           // 확정 기간(개월)
    private BigDecimal approvedRate;        // 확정 금리(%)
    private OffsetDateTime firstPayoutAt;    // 지급일(없으면 now)
    private Integer payDay;                 // 1~28 지급일 (firstPayoutAt)없으면 사용
    private String memo;                    // 내부 메모
}
