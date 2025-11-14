package com.boot.eumbank.transfer_domain.transfer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * [이체 수수료 요청 DTO]
 * - 이체 수수료 계산을 위한 요청 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferFeeRequestDto {
    
    @NotNull(message = "출금계좌번호는 필수입니다")
    private Integer fromAccountNo;
    
    @NotNull(message = "수취계좌번호는 필수입니다")
    private String toAccount;
    
    @NotNull(message = "이체금액은 필수입니다")
    @Positive(message = "이체금액은 양수여야 합니다")
    private Long amount;
    
    private String bankCode; // 은행코드 (선택사항)
    
    private String transferType; // 이체유형 (선택사항)
}
