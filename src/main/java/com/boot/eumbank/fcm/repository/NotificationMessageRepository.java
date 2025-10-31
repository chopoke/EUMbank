package com.boot.eumbank.fcm.repository;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.fcm.entity.NotificationMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 알림 메시지 레파지토리
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Repository
public interface NotificationMessageRepository extends JpaRepository<NotificationMessage, Long> {

    /**
     * 고객별 알림 목록 조회 (페이징)
     */
    Page<NotificationMessage> findByCustomer(Customer customer, Pageable pageable);

    /**
     * 고객별 미읽음 알림 개수 조회
     */
    long countByCustomerAndIsRead(Customer customer, String isRead);

    /**
     * 메시지 ID로 조회
     */
    Optional<NotificationMessage> findByMessageId(Long messageId);
}

