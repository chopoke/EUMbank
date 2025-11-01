package com.boot.eumbank.transfer_domain.transfer.event;

import lombok.Getter;

/**
 * 이체 완료 이벤트
 * 
 * <p>이체가 성공적으로 완료되었을 때 발행되는 이벤트입니다.</p>
 * <p>이벤트 리스너가 이 이벤트를 수신하여 푸시 알림을 발송합니다.</p>
 * 
 * <p><strong>설계 원칙</strong></p>
 * <ul>
 *   <li>TransferServiceImpl은 FcmService를 직접 알지 못하며, 이벤트만 발행합니다.</li>
 *   <li>NotificationEventListener가 이벤트를 구독하여 알림을 처리합니다.</li>
 *   <li>이체 로직과 알림 로직이 완전히 분리되어 유지보수가 쉽습니다.</li>
 * </ul>
 * 
 * @author EUMbank Team
 * @since 2025-10-28
 */
@Getter
public class TransferCompletedEvent {

    /**
     * 출금자 고객 번호 (필수)
     */
    private final Integer fromCustomerNo;

    /**
     * 입금자 고객 번호 (내부 이체가 아니면 null)
     */
    private final Integer toCustomerNo;

    /**
     * 이체 금액
     */
    private final long amount;

    /**
     * 출금 후 잔액
     */
    private final long fromAccountBalance;

    /**
     * 입금 후 잔액 (내부 이체가 아니면 0)
     */
    private final long toAccountBalance;

    /**
     * 내부 이체용 생성자
     * 
     * <p>같은 은행 내 계좌 간 이체 시 사용합니다.</p>
     * <p>출금자와 입금자 모두에게 알림을 발송합니다.</p>
     * 
     * @param fromCustomerNo 출금자 고객 번호
     * @param toCustomerNo 입금자 고객 번호
     * @param amount 이체 금액
     * @param fromAccountBalance 출금 후 잔액
     * @param toAccountBalance 입금 후 잔액
     */
    public TransferCompletedEvent(Integer fromCustomerNo, Integer toCustomerNo, long amount,
                                  long fromAccountBalance, long toAccountBalance) {
        this.fromCustomerNo = fromCustomerNo;
        this.toCustomerNo = toCustomerNo;
        this.amount = amount;
        this.fromAccountBalance = fromAccountBalance;
        this.toAccountBalance = toAccountBalance;
    }

    /**
     * 타행 이체용 생성자
     * 
     * <p>다른 은행으로 이체 시 사용합니다.</p>
     * <p>출금자에게만 알림을 발송합니다.</p>
     * 
     * @param fromCustomerNo 출금자 고객 번호
     * @param amount 이체 금액
     * @param fromAccountBalance 출금 후 잔액
     */
    public TransferCompletedEvent(Integer fromCustomerNo, long amount, long fromAccountBalance) {
        this(fromCustomerNo, null, amount, fromAccountBalance, 0L);
    }

    /**
     * 내부 이체 여부 확인
     * 
     * @return 내부 이체이면 true, 타행 이체이면 false
     */
    public boolean isInternalTransfer() {
        return toCustomerNo != null;
    }

    /**
     * 본인 계좌 간 이체 여부 확인
     * 
     * @return 본인 계좌끼리의 이체면 true, 그 외는 false
     */
    public boolean isSelfTransfer() {
        return toCustomerNo != null && fromCustomerNo.equals(toCustomerNo);
    }
}

