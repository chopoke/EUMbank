package com.boot.eumbank.asset.assetanalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 현물 자산 요약 DTO.
 * 금고(월렛)의 현금 및 금/은 보유량 정보를 담는다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhysicalAssetSummaryDto {

    /** 현물 월렛 현금 잔액 (KRW) */
    @Builder.Default
    private BigDecimal cashBalance = BigDecimal.ZERO;

    /** 금 보유량 (gram) */
    @Builder.Default
    private BigDecimal goldGram = BigDecimal.ZERO;

    /** 은 보유량 (gram) */
    @Builder.Default
    private BigDecimal silverGram = BigDecimal.ZERO;

    /**
     * 빈 요약 객체 생성 유틸리티.
     *
     * @return 모든 값이 0인 요약 객체
     */
    public static PhysicalAssetSummaryDto empty() {
        return PhysicalAssetSummaryDto.builder().build();
    }
}

