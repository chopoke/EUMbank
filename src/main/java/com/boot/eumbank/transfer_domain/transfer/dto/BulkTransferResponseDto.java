package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

/**
 * [다건 이체 응답 DTO]
 * - 다건 이체 처리 결과를 담는 데이터 구조
 * - 성공/실패 건수, 결과 목록 등 포함
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkTransferResponseDto {
    
    private int totalCount;               // 총 수취인 수
    private int successCount;             // 성공 건수
    private int failCount;                // 실패 건수
    private List<TransferResultDto> results;  // 모든 이체 결과 목록 (성공/실패 포함)
    private Long totalAmount;          // 총 이체 금액
    private BigDecimal finalBalance;       // 최종 잔액
}