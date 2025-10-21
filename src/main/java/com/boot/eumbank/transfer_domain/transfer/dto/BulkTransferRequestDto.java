package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * [다건 이체 요청 DTO]
 * - 프론트엔드에서 다건 이체 요청 시 전송하는 데이터 구조
 * - 하나의 출금 계좌에서 여러 수취인에게 이체
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkTransferRequestDto {
    
    private Integer fromAccountNo;          // 출금 계좌 번호 (a_no)
    private String password;                // 계좌 비밀번호 (1회만 검증)
    private List<RecipientDto> recipients;  // 수취인 목록
}

