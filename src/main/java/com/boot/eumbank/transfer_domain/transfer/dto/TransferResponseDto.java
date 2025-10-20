package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * [이체 응답 DTO]
 * - 이체 처리 완료 후 프론트엔드로 반환하는 데이터 구조
 * - 이체 결과 정보 및 상세 내역 포함
 * - 주요 필드:
 *   - transferId: 고유 이체 식별자
 *   - transferNo: 이체 번호
 *   - amount: 이체 금액
 *   - afterBalance: 이체 후 잔액
 *   - transferAt: 이체 일시
 *   - otherBank/otherAccount: 상대방 은행/계좌 정보
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferResponseDto {
    
    private String transferId;
    private Long transferNo;
    private String accountId;
    private BigDecimal amount;
    private String memo;
    private LocalDateTime transferAt;
    private String otherBank;
    private String otherAccount;
    private String transferType;
    private BigDecimal afterBalance;
    private String transactionType;
    private BigDecimal accountOut;
    private BigDecimal accountIn;
}
