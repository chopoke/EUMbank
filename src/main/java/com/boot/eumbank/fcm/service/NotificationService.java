package com.boot.eumbank.fcm.service;

import com.boot.eumbank.transfer_domain.transfer.event.TransferCompletedEvent;
import com.boot.eumbank.transfer_domain.transfer.event.TransferFailedEvent;

/**
 * 알림 서비스 인터페이스
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
public interface NotificationService {

    /**
     * 이체 완료 알림 발송
     * 
     * @param event 이체 완료 이벤트
     */
    void sendTransferNotification(TransferCompletedEvent event);

    /**
     * 이체 실패 알림 발송
     * 
     * @param event 이체 실패 이벤트
     */
    void sendTransferFailureNotification(TransferFailedEvent event);
}

