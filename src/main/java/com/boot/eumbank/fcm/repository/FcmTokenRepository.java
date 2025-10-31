package com.boot.eumbank.fcm.repository;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.fcm.entity.FcmToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * FCM 토큰 레파지토리
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    /**
     * 고객과 구독 상태로 토큰 조회
     */
    List<FcmToken> findByCustomerAndIsSubscribed(Customer customer, String isSubscribed);

    /**
     * FCM 토큰 문자열로 조회
     */
    Optional<FcmToken> findByFcmToken(String fcmToken);

    /**
     * 토큰 목록으로 일괄 삭제
     */
    void deleteAllByFcmTokenIn(List<String> fcmTokens);
}
