package com.boot.eumbank.transfer_domain.transfer.dto;

import java.util.List;

/**
 * [예약/자동 이체 상태 변경 요청 DTO]
 * - 다중 예약 이체 주문의 상태를 일괄 변경할 때 사용
 * - 지원 상태: SCHEDULED, PAUSED, CANCELLED
 */
public class TransferOrderStatusUpdateRequest {

    private List<Integer> orderIds;
    private String status;

    /**
     * 예약/자동 이체 주문 ID 목록을 반환합니다.
     *
     * @return 상태 변경 대상 주문 ID 목록
     */
    public List<Integer> getOrderIds() {
        return orderIds;
    }

    /**
     * 예약/자동 이체 주문 ID 목록을 설정합니다.
     *
     * @param orderIds 상태 변경 대상 주문 ID 목록
     */
    public void setOrderIds(List<Integer> orderIds) {
        this.orderIds = orderIds;
    }

    /**
     * 목표 상태 코드를 반환합니다.
     *
     * @return 변경할 상태 코드
     */
    public String getStatus() {
        return status;
    }

    /**
     * 목표 상태 코드를 설정합니다.
     *
     * @param status 변경할 상태 코드
     */
    public void setStatus(String status) {
        this.status = status;
    }
}

