package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * [이체 결과 DTO]
 * - 이체 실행 결과를 담는 데이터 구조
 * - 내부 로직에서 사용
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferResultDto {
    
    private String transferId;            // 이체 ID
    private Integer transferNo;           // 이체 번호
    private Integer fromAccountNo;        // 출금 계좌 번호
    private String toAccountNo;           // 수취 계좌번호
    private Integer amount;               // 이체 금액
    private BigDecimal afterBalance;      // 이체 후 잔액
    private LocalDateTime transferAt;     // 이체 시간
    private boolean success;              // 성공 여부
    private String message;               // 결과 메시지
}