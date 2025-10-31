package com.boot.eumbank.fcm.listener;

import com.boot.eumbank.fcm.service.NotificationService;
import com.boot.eumbank.transfer_domain.transfer.event.TransferCompletedEvent;
import com.boot.eumbank.transfer_domain.transfer.event.TransferFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 알림 이벤트 리스너
 * 
 * <p>이체 완료/실패 이벤트를 수신하여 푸시 알림을 발송합니다.</p>
 * <p>트랜잭션 커밋 후에 실행되어 예약이체에서도 안정적으로 동작합니다.</p>
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * 이체 완료 이벤트 리스너
     * 
     * <p>@TransactionalEventListener를 사용하여 트랜잭션 커밋 후에 실행됩니다.</p>
     * <p>이렇게 하면 예약이체 스케줄러의 트랜잭션이 완료된 후에 알림이 발송됩니다.</p>
     * 
     * @param event 이체 완료 이벤트
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTransferCompletion(TransferCompletedEvent event) {
        log.info("이체 완료 이벤트 수신 - 출금자: {}, 입금자: {}, 금액: {}", 
                event.getFromCustomerNo(), event.getToCustomerNo(), event.getAmount());

        try {
            notificationService.sendTransferNotification(event);
            log.info("✅ 이체 완료 알림 발송 완료");
        } catch (Exception e) {
            log.error("❌ 이체 완료 알림 발송 실패: {}", e.getMessage(), e);
            // 알림 실패는 이체에 영향을 주지 않음
        }
    }

    /**
     * 이체 실패 이벤트 리스너
     * 
     * <p>@TransactionalEventListener를 사용하여 트랜잭션 커밋 후에 실행됩니다.</p>
     * <p>예약이체 실패 시에도 알림을 발송합니다.</p>
     * 
     * @param event 이체 실패 이벤트
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTransferFailure(TransferFailedEvent event) {
        log.info("이체 실패 이벤트 수신 - 출금자: {}, 금액: {}, 실패사유: {}", 
                event.getFromCustomerNo(), event.getAmount(), event.getFailureReason());

        try {
            notificationService.sendTransferFailureNotification(event);
            log.info("✅ 이체 실패 알림 발송 완료");
        } catch (Exception e) {
            log.error("❌ 이체 실패 알림 발송 실패: {}", e.getMessage(), e);
            // 알림 실패는 이체에 영향을 주지 않음
        }
    }
}

