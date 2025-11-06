package com.boot.eumbank.loan.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RepaymentResponseDTO {

    private Long loanNo;
    private String lpGroupId;                   // 이번 상환 묶음 ID (예: RP20251103-123456)
    private BigDecimal receivedTotal;
    private BigDecimal appliedToInterest;
    private BigDecimal appliedToPrincipal;
    private BigDecimal appliedToPenalty;
    private BigDecimal remainingAfterApply;

    private List<Item> allocations;             // 회차별 배분 내역

    // 리스트로 넣어주기
    @Data @Builder
    public static class Item {
        private Integer installmentNo;
        private Long scheduleId;
        private BigDecimal appliedInterest;
        private BigDecimal appliedPrincipal;
        private BigDecimal appliedPenalty;      // 회차 또는 벌금 납부한 전용
        private String newStatus;               // DUE/PARTIAL/PAID
        private String lpId;                    // 생성된 payment row의 lp_id
    }
}
