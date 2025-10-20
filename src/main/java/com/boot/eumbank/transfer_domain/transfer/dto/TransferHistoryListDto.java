package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * [이체 내역 목록 DTO]
 * - 이체 내역 조회 시 사용하는 데이터 구조
 * - TransferHistory Entity와 매핑
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferHistoryListDto {
    
    private Integer transferNo;           // 이체 번호
    private String transferId;            // 이체 ID
    private BigDecimal amount;            // 이체 금액
    private String memo;                  // 이체 메모
    private LocalDateTime transferAt;     // 이체 시간
    private String otherBank;             // 상대방 은행
    private String otherAccount;          // 상대방 계좌
    private String transferType;          // 이체 유형
    private BigDecimal afterBalance;      // 이체 후 잔액
    private String transactionType;       // 거래 유형 (IN/OUT)
    private BigDecimal accountOut;        // 출금액
    private BigDecimal accountIn;         // 입금액
}