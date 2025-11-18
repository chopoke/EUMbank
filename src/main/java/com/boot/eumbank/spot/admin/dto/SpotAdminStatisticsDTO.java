package com.boot.eumbank.spot.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 현물 관리자 통계 DTO
 * 관리자 대시보드에서 사용할 현물 관련 통계 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotAdminStatisticsDTO {
    
    /** 현물 지갑 총 개수 */
    private Long totalWalletCount;
    
    /** 현물 현금 잔고 총액 (원화) */
    private BigDecimal totalCashBalance;
    
    /** 금 보유량 총합 (그램) */
    private BigDecimal totalGoldBalance;
    
    /** 은 보유량 총합 (그램) */
    private BigDecimal totalSilverBalance;
    
    /** 현재 금 시세 (그램당) */
    private BigDecimal currentGoldPrice;
    
    /** 현재 은 시세 (그램당) */
    private BigDecimal currentSilverPrice;
    
    /** 금 평가액 총합 (현재 시세 × 금 보유량) */
    private BigDecimal totalGoldEvaluation;
    
    /** 은 평가액 총합 (현재 시세 × 은 보유량) */
    private BigDecimal totalSilverEvaluation;
    
    /** 현물 총 자산 (현금 + 금 평가액 + 은 평가액) */
    private BigDecimal totalSpotAssets;
    
    /** 현물 거래 총 건수 */
    private Long totalTransactionCount;
    
    /** 현물 거래 총액 */
    private BigDecimal totalTransactionAmount;
    
    /** 현물 고객 수 */
    private Long totalSpotCustomerCount;
    
    /** 현물 총 투자금액 */
    private BigDecimal totalInvestment;
    
    /** 현물 총 손익 */
    private BigDecimal totalProfitLoss;
}


