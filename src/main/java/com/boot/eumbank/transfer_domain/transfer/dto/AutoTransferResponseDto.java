package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * [자동이체 등록 응답 DTO]
 * - 자동이체 등록 결과를 담는 데이터 구조
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoTransferResponseDto {
    
    private Long totalAmount;             // 총 이체 금액 (1회당 × 횟수)
    private String startDate;             // 시작 날짜 (YYYY-MM-DD 형식)
    private String endDate;               // 종료 날짜 (YYYY-MM-DD 형식)
    private Integer registeredCount;      // 등록된 예약이체 수
    private List<Integer> orderIds;       // 등록된 예약이체 주문 ID 목록
    private boolean success;              // 등록 성공 여부
    private String message;               // 결과 메시지
}

