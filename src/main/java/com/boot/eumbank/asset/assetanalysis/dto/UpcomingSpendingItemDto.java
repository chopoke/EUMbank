package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 다음달 예정 지출 항목 DTO.
 * 지출 유형별 금액/비중을 프론트로 전달하기 위해 사용한다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingSpendingItemDto {

    /** 지출 유형 또는 분류명 */
    private String category;

    /** 해당 유형의 총 지출 금액 (원) */
    private BigDecimal amount;

    /** 전체 대비 비중 (%) */
    private BigDecimal percentage;

    /** 해당 유형에 속한 지출 건수 */
    private Integer paymentCount;

    /** 가장 빠른 예정 출금일 */
    private LocalDate firstScheduledDate;

    /** 대표 메모 또는 비고 */
    private String memoSample;
}

