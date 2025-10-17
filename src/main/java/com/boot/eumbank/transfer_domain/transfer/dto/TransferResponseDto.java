package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 이체 응답 DTO
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
