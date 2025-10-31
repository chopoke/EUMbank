package com.boot.eumbank.fcm.service;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.fcm.entity.FcmToken;
import com.boot.eumbank.fcm.entity.NotificationMessage;
import com.boot.eumbank.fcm.repository.FcmTokenRepository;
import com.boot.eumbank.fcm.repository.NotificationMessageRepository;
import com.boot.eumbank.transfer_domain.transfer.event.TransferCompletedEvent;
import com.boot.eumbank.transfer_domain.transfer.event.TransferFailedEvent;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 알림 서비스 구현체
 * 메시지를 생성하며, DB에 저장하고, 사용자에 전달하는 클래스
 *
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final FcmTokenRepository fcmTokenRepository;
    private final NotificationMessageRepository notificationMessageRepository;
    private final CustomerRepo customerRepository;
    private final FirebaseMessaging firebaseMessaging;

    @Override
    public void sendTransferNotification(TransferCompletedEvent event) {
        log.info("이체 완료 알림 발송 시작 - 출금자: {}, 입금자: {}, 금액: {}", 
                event.getFromCustomerNo(), event.getToCustomerNo(), event.getAmount());

        // 1. 출금자 알림 발송
        sendWithdrawalNotification(event);

        // 2. 입금자 알림 발송 (내부 이체인 경우만)
        if (event.isInternalTransfer() && !event.isSelfTransfer()) {
            sendDepositNotification(event);
        }
    }

    @Override
    public void sendTransferFailureNotification(TransferFailedEvent event) {
        log.info("이체 실패 알림 발송 시작 - 출금자: {}, 금액: {}, 실패사유: {}", 
                event.getFromCustomerNo(), event.getAmount(), event.getFailureReason());

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy년 M월 d일");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("H시 m분");

        String dateStr = now.format(dateFormatter);
        String timeStr = now.format(timeFormatter);

        // 실패 사유에 따른 메시지 구성
        String reasonText = getFailureReasonText(event.getFailureReason(), event.getFailureMessage());
        
        String title = event.isReservedTransfer() ? "예약 이체 실패" : "이체 실패";
        String body = String.format("%s %s %s님께 %,d원 이체를 실패했습니다. %s", 
                dateStr, timeStr, event.getRecipientName(), event.getAmount(), reasonText);
        
        Map<String, String> data = Map.of("click_action", event.isReservedTransfer() 
                ? "/transfer/reserve" : "/account/history");

        processAndSend(event.getFromCustomerNo(), title, body, data);
    }

    /**
     * 실패 사유 코드를 사용자 친화적인 텍스트로 변환
     */
    private String getFailureReasonText(String failureReason, String failureMessage) {
        if (failureReason == null) {
            return "알 수 없는 오류가 발생했습니다.";
        }

        switch (failureReason) {
            case "INSUFFICIENT_BALANCE":
                return String.format("잔액이 부족합니다. 현재 잔액: %,d원", 
                        failureMessage.contains("현재 잔액") 
                                ? extractBalanceFromMessage(failureMessage) 
                                : 0);
            case "LIMIT_EXCEEDED":
                return "이체 한도를 초과했습니다.";
            case "ACCOUNT_NOT_FOUND":
                return "계좌를 찾을 수 없습니다.";
            case "ACCOUNT_SUSPENDED":
                return "계좌가 거래 불가능한 상태입니다.";
            case "PASSWORD_MISMATCH":
                return "비밀번호가 일치하지 않습니다.";
            case "INVALID_AMOUNT":
                return "이체 금액이 올바르지 않습니다.";
            case "SAME_ACCOUNT":
                return "자기 계좌로는 이체할 수 없습니다.";
            case "UNAUTHORIZED":
                return "권한이 없습니다.";
            default:
                return failureMessage != null && !failureMessage.isEmpty() 
                        ? failureMessage 
                        : "이체 처리 중 오류가 발생했습니다.";
        }
    }

    /**
     * 메시지에서 잔액 숫자 추출 (간단한 구현)
     */
    private long extractBalanceFromMessage(String message) {
        try {
            // "현재 잔액: ₩123,456원" 형태에서 숫자 추출
            String[] parts = message.split("₩|원");
            for (String part : parts) {
                String cleaned = part.replace(",", "").trim();
                if (!cleaned.isEmpty() && cleaned.matches("\\d+")) {
                    return Long.parseLong(cleaned);
                }
            }
        } catch (Exception e) {
            log.debug("잔액 추출 실패: {}", message);
        }
        return 0;
    }

    /**
     * 출금자 알림 발송
     */
    private void sendWithdrawalNotification(TransferCompletedEvent event) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy년 M월 d일");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("H시 m분");

        String dateStr = now.format(dateFormatter);
        String timeStr = now.format(timeFormatter);

        Customer customer = customerRepository.findById(event.getFromCustomerNo()).orElse(null);
        if (customer == null) {
            log.warn("출금자 고객 정보를 찾을 수 없음 - customerNo: {}", event.getFromCustomerNo());
            return;
        }

        String recipientName = event.getToCustomerNo() != null 
                ? customerRepository.findById(event.getToCustomerNo()).map(Customer::getCNameKr).orElse("수취인")
                : "수취인";

        String title = "출금 완료";
        String body = String.format("%s %s %s님께 %,d원을 이체했습니다. 잔액: %,d원", 
                dateStr, timeStr, recipientName, event.getAmount(), event.getFromAccountBalance());
        
        Map<String, String> data = Map.of("click_action", "/account/history");

        processAndSend(event.getFromCustomerNo(), title, body, data);
    }

    /**
     * 입금자 알림 발송
     */
    private void sendDepositNotification(TransferCompletedEvent event) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy년 M월 d일");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("H시 m분");

        String dateStr = now.format(dateFormatter);
        String timeStr = now.format(timeFormatter);

        Customer customer = customerRepository.findById(event.getToCustomerNo()).orElse(null);
        if (customer == null) {
            log.warn("입금자 고객 정보를 찾을 수 없음 - customerNo: {}", event.getToCustomerNo());
            return;
        }

        String senderName = customerRepository.findById(event.getFromCustomerNo())
                .map(Customer::getCNameKr)
                .orElse("출금인");

        String title = "입금 완료";
        String body = String.format("%s %s %s님이 %,d원을 입금했습니다. 잔액: %,d원", 
                dateStr, timeStr, senderName, event.getAmount(), event.getToAccountBalance());
        
        Map<String, String> data = Map.of("click_action", "/account/history");

        processAndSend(event.getToCustomerNo(), title, body, data);
    }

    /**
     * 알림 처리 및 발송 (공통 로직)
     */
    private void processAndSend(Integer customerNo, String title, String body, Map<String, String> data) {
        Customer customer = customerRepository.findById(customerNo).orElse(null);
        if (customer == null) {
            log.warn("고객 정보를 찾을 수 없음 - customerNo: {}", customerNo);
            return;
        }

        // 1. DB에 알림 메시지 저장
        NotificationMessage message = NotificationMessage.builder()
                .customer(customer)
                .title(title)
                .body(body)
                .isRead("off")
                .clickActionUrl(data.get("click_action"))
                .build();
        
        notificationMessageRepository.save(message);
        log.info("알림 메시지 저장 완료 - customerNo: {}, title: {}", customerNo, title);

        // 2. 활성화된 토큰 조회 (isSubscribed = "on")
        List<FcmToken> activeTokens = fcmTokenRepository.findByCustomerAndIsSubscribed(customer, "on");
        
        if (activeTokens.isEmpty()) {
            log.info("알림 수신에 동의한 기기가 없음 - customerNo: {}", customerNo);
            return;
        }

        List<String> tokenStrings = activeTokens.stream()
                .map(FcmToken::getFcmToken)
                .collect(Collectors.toList());

        log.info("FCM 알림 발송 대상 토큰 {}개 - customerNo: {}", tokenStrings.size(), customerNo);

        // 3. 개별 메시지로 FCM 발송 (/batch 엔드포인트 우회)
        int successCount = 0;
        int failureCount = 0;
        List<String> failedTokens = new java.util.ArrayList<>();

        for (String token : tokenStrings) {
            try {
                Message fcmMessage = Message.builder()
                        .setToken(token)
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setWebpushConfig(WebpushConfig.builder()
                                .setNotification(WebpushNotification.builder()
                                        .setTitle(title)
                                        .setBody(body)
                                        .setIcon("/favicon.ico")
                                        .setBadge("/favicon.ico")
                                        .build())
                                .putAllData(data)
                                .build())
                        .putAllData(data)
                        .build();

                firebaseMessaging.send(fcmMessage);
                successCount++;
                log.debug("FCM 알림 발송 성공 - 토큰: {}", token.substring(0, 20) + "...");

            } catch (FirebaseMessagingException e) {
                failureCount++;
                failedTokens.add(token);
                log.warn("FCM 알림 발송 실패 - 토큰: {}, 에러: {}", 
                        token.substring(0, 20) + "...", e.getMessage());
            } catch (Exception e) {
                failureCount++;
                failedTokens.add(token);
                log.error("FCM 알림 발송 중 예외 발생 - 토큰: {}, 에러: {}", 
                        token.substring(0, 20) + "...", e.getMessage(), e);
            }
        }

        log.info("FCM 알림 발송 결과 - 성공: {}건, 실패: {}건", successCount, failureCount);

        // 4. 실패한 토큰 삭제
        if (!failedTokens.isEmpty()) {
            fcmTokenRepository.deleteAllByFcmTokenIn(failedTokens);
            log.info("만료된 FCM 토큰 {}개 삭제 완료", failedTokens.size());
        }
    }
}

