package com.boot.eumbank.loan.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanApplyDetailDTO {
    private LoanApplySummaryDTO summary;
    // 제출 당시 입력한 원본 폼/서류들
    private Object applicationForm;       // Map<String,Object> 등으로도 가능
    private Object attachedDocs;          // 첨부서류 목록(파일 메타)
    // 심사 메타
    private LocalDateTime reviewedAt;
    private String rejectReason;          // 반려사유(있다면)
    // 승인안(확정 금리/금액/기간 등)
    private BigDecimal approvedAmount;
    private Integer approvedTerm;
    private BigDecimal approvedRate;      // 최종 적용금리(%)
}
