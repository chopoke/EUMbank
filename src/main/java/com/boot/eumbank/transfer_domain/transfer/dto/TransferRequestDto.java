package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;

/**
 * [이체 요청 DTO]
 * - 프론트엔드에서 이체 요청 시 전송하는 데이터 구조
 * - Controller에서 받아서 Service로 전달
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequestDto {
    
    private Integer fromAccountNo;      // 출금 계좌 번호 (a_no)
    private String fromAccountId;       // 출금 계좌 ID (선택사항)
    private String toBank;              // 수취 은행명
    private String toAccount;           // 수취 계좌번호
    private String toName;              // 수취인명
    private Integer amount;             // 이체 금액
    private String memo;                // 이체 메모
    private String password;            // 계좌 비밀번호
    private Boolean reserveTransfer;    // 예약 이체 여부 (선택사항)
    private String reserveDate;         // 예약 날짜 (선택사항)
    private String reserveTime;         // 예약 시간 (선택사항)
}
