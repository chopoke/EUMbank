package com.boot.eumbank.transfer_domain.transfer.event;

import lombok.Getter;

/**
 * 이체 실패 이벤트
 * 
 * <p>이체가 실패했을 때 발행되는 이벤트입니다.</p>
 * <p>이벤트 리스너가 이 이벤트를 수신하여 실패 알림을 발송합니다.</p>
 * 
 * <p><strong>설계 원칙</strong></p>
 * <ul>
 *   <li>TransferServiceImpl은 FcmService를 직접 알지 못하며, 이벤트만 발행합니다.</li>
 *   <li>NotificationEventListener가 이벤트를 구독하여 알림을 처리합니다.</li>
 *   <li>이체 로직과 알림 로직이 완전히 분리되어 유지보수가 쉽습니다.</li>
 * </ul>
 * 
 * @author EUMbank Team
 * @since 2025-10-31
 */
@Getter
public class TransferFailedEvent {

    /**
     * 출금자 고객 번호 (필수)
     */
    private final Integer fromCustomerNo;

    /**
     * 수취인명 (알림 메시지에 사용)
     */
    private final String recipientName;

    /**
     * 이체 금액
     */
    private final long amount;

    /**
     * 현재 잔액
     */
    private final long currentBalance;

    /**
     * 실패 사유 코드
     */
    private final String failureReason;

    /**
     * 실패 사유 메시지
     */
    private final String failureMessage;

    /**
     * 예약 이체 여부
     */
    private final boolean isReservedTransfer;

    /**
     * 생성자
     * 
     * @param fromCustomerNo 출금자 고객 번호
     * @param recipientName 수취인명
     * @param amount 이체 금액
     * @param currentBalance 현재 잔액
     * @param failureReason 실패 사유 코드
     * @param failureMessage 실패 사유 메시지
     * @param isReservedTransfer 예약 이체 여부
     */
    public TransferFailedEvent(Integer fromCustomerNo, String recipientName, long amount,
                              long currentBalance, String failureReason, String failureMessage,
                              boolean isReservedTransfer) {
        this.fromCustomerNo = fromCustomerNo;
        this.recipientName = recipientName;
        this.amount = amount;
        this.currentBalance = currentBalance;
        this.failureReason = failureReason;
        this.failureMessage = failureMessage;
        this.isReservedTransfer = isReservedTransfer;
    }
}

