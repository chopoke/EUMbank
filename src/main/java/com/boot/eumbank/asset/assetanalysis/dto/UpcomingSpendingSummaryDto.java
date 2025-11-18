package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 다음달 예정 지출 요약 DTO.
 * 총액과 유형별 세부 항목을 포괄적으로 제공한다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingSpendingSummaryDto {

    /** 조회 기간 시작일 (다음달 1일) */
    private LocalDate rangeStart;

    /** 조회 기간 종료일 (다음달 말일) */
    private LocalDate rangeEnd;

    /** 총 예정 지출 금액 (원) */
    private BigDecimal totalAmount;

    /** 예정 지출 항목 목록 */
    private List<UpcomingSpendingItemDto> items;

    /** 전체 예정 지출 건수 */
    private Integer totalPaymentCount;
}

