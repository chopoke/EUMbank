package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [자동이체 등록 요청 DTO]
 * - 자동이체 등록 시 사용하는 데이터 구조
 * - 매월 지정일에 반복 실행되는 예약이체를 여러개 등록
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoTransferRequestDto {
    
    private Integer fromAccountNo;        // 출금 계좌 번호 (a_no)
    private String bankCode;              // 수취 은행 코드
    private String destAccountNo;         // 수취 계좌번호
    private Long amount;                  // 1회당 이체 금액
    private Integer startYear;            // 시작 연도
    private Integer startMonth;           // 시작 월 (1~12)
    private Integer dayOfMonth;          // 매월 지정일 (1~31)
    private Integer repeatCount;         // 반복 횟수
    private String memo;                  // 이체 메모
    private String password;              // 계좌 비밀번호 (등록 시 검증용)
}

