package com.boot.eumbank.loan.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RepaymentRequestDTO {
    /** 이번 결제(수납) 총액(원금+이자+연체 포함) */
    private BigDecimal amount;

    /** 결제 시각 */
    private LocalDateTime paymentTime;

    /** 멱등키(중복 방지)  */
    private String idempotencyKey;

    /** 타깃 지정: 아래 둘 중 하나만 쓰면 댐 */
    private Integer installmentNo;  // 회차 지정(1..n)
    private Long scheduleId;        // 스케줄 PK(ls_id)

    /** 옵션 */
    private Integer payFromAccountNo;   // 상환 출금 계좌 (미지정 시 loan.repayAccount)
    private Boolean allowPartial;       // 부분 상환 허용 여부(기본 false)
    private String memo;                // 비고
}
