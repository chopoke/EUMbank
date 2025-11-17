package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 다음달 예정된 예약/자동 이체 정보 DTO.
 * 자산 분석 모듈에서 다음달 확정 지출 금액을 계산하는 데 사용한다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NextMonthScheduledTransferDto {

    private BigDecimal amount;
    private LocalDateTime scheduledAt;
    private String scheduleType;
    private String executionType;
    private String memo;
}

