package com.boot.eumbank.fcm.listener;

import com.boot.eumbank.fcm.service.NotificationService;
import com.boot.eumbank.transfer_domain.transfer.event.TransferCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 알림 이벤트 리스너
 * 
 * <p>이체 완료 이벤트를 수신하여 푸시 알림을 발송합니다.</p>
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
     * @param event 이체 완료 이벤트
     */
    @Async
    @EventListener
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
}

