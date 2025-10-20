package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [예약 이체 DTO]
 * - 예약 이체 등록/조회 시 사용하는 데이터 구조
 * - TransferOrder Entity와 매핑
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferOrderDto {
    
    private Integer orderId;              // 예약 이체 주문 ID
    private Integer accountNo;            // 출금 계좌 번호 (a_no)
    private String bankCode;              // 수취 은행 코드
    private String destAccountNo;         // 수취 계좌번호
    private Integer amount;               // 이체 금액
    private String scheduleType;          // 스케줄 유형 (ONCE, RECURRING)
    private String scheduleExpr;          // 스케줄 표현식 (cron 등)
    private String startAt;               // 시작 시간
    private String endAt;                 // 종료 시간
    private String status;                // 상태 (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
    private String memo;                  // 이체 메모
    private String createdAt;             // 생성 시간
}