package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

/**
 * [이체 확인 DTO]
 * - 이체 전 최종 확인 시 사용하는 데이터 구조
 * - 잔액, 한도 등 확인 정보 포함
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferConfirmDto {
    
    private Integer fromAccountNo;        // 출금 계좌 번호
    private String toAccount;             // 수취 계좌번호
    private Long amount;               // 이체 금액
    private BigDecimal currentBalance;    // 현재 잔액
    private BigDecimal availableBalance;  // 사용 가능 잔액
    private BigDecimal transferLimit;     // 이체 한도
    private boolean canTransfer;          // 이체 가능 여부
    private String message;               // 확인 메시지
}