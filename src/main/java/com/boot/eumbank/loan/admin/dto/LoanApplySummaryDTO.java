package com.boot.eumbank.loan.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


/**
 * 대출 신청 목록에서 사용되는 신청 정보 summary DTO
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanApplySummaryDTO {
    private Long laNo;                // 신청번호 (PK)
    private String laId;              // 신청ID (unique)
    private Integer cNo;              // 고객번호
    private Long lpdNo;               // 상품번호
    private String productName;       // 상품명 (조인)
    private String applyStatus;       // ApplyStatus.name()
    private BigDecimal applyAmount;   // 신청금액
    private Integer desiredTerm;      // 신청기간(개월)
    private String purposeCode;       // 생활비/대환/주거비 등
    private String channel;           // 접수채널
    private LocalDateTime submitDate; // 제출시각
    // 표시용
    private Integer payoutAccountNo;            // 신청계좌 No
    private Integer repayAccountNo;              // 상환계좌 No

}
