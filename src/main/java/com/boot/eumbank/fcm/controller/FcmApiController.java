package com.boot.eumbank.fcm.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.fcm.dto.*;
import com.boot.eumbank.fcm.entity.FcmToken;
import com.boot.eumbank.fcm.entity.NotificationMessage;
import com.boot.eumbank.fcm.repository.FcmTokenRepository;
import com.boot.eumbank.fcm.repository.NotificationMessageRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.boot.eumbank.fcm.entity.QNotificationMessage.notificationMessage;

/**
 * FCM API 컨트롤러
 * 
 * @author EUMbank Team
 * @since 2025-01-15
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FcmApiController {

    private final FcmTokenRepository fcmTokenRepository;
    private final NotificationMessageRepository notificationMessageRepository;
    private final JPAQueryFactory queryFactory;

    /**
     * FCM 토큰 구독 API
     */
    @PostMapping("/fcm/subscribe")
    @Transactional
    public ResponseEntity<Map<String, Object>> subscribe(
            @AuthenticationPrincipal Customer customer,
            @Valid @RequestBody FcmSubscribeRequestDto request) {

        log.info("FCM 구독 요청 - 고객번호: {}, 토큰: {}", customer.getCustomerNo(), request.getFcmToken().substring(0, 20) + "...");

        try {
            Optional<FcmToken> existing = fcmTokenRepository.findByFcmToken(request.getFcmToken());

            if (existing.isPresent()) {
                // Case 1: 토큰이 이미 존재 (다른 고객의 기기일 수 있음)
                FcmToken token = existing.get();
                token.setCustomer(customer);
                token.setDeviceInfo(request.getDeviceInfo());
                token.setIsSubscribed("on");
                fcmTokenRepository.save(token);
                
                log.info("기존 토큰 주인 변경 및 재활성화 완료");
            } else {
                // Case 2: 새 토큰
                FcmToken newToken = FcmToken.builder()
                        .customer(customer)
                        .fcmToken(request.getFcmToken())
                        .deviceInfo(request.getDeviceInfo())
                        .isSubscribed("on")
                        .build();
                fcmTokenRepository.save(newToken);
                
                log.info("새 토큰 등록 완료");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "알림이 활성화되었습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("FCM 구독 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "알림 활성화에 실패했습니다.");

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * FCM 토큰 구독 해제 API
     */
    @PostMapping("/fcm/unsubscribe")
    @Transactional
    public ResponseEntity<Map<String, Object>> unsubscribe(
            @AuthenticationPrincipal Customer customer,
            @Valid @RequestBody FcmUnsubscribeRequestDto request) {

        log.info("FCM 구독 해제 요청 - 고객번호: {}", customer.getCustomerNo());

        try {
            Optional<FcmToken> tokenOpt = fcmTokenRepository.findByFcmToken(request.getFcmToken());

            if (tokenOpt.isPresent()) {
                FcmToken token = tokenOpt.get();
                
                // 본인 토큰인지 확인
                if (!token.getCustomer().getCustomerNo().equals(customer.getCustomerNo())) {
                    log.warn("권한 없음 - 요청자: {}, 토큰 주인: {}", 
                            customer.getCustomerNo(), token.getCustomer().getCustomerNo());
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "권한이 없습니다.");
                    return ResponseEntity.badRequest().body(response);
                }

                fcmTokenRepository.delete(token);
                log.info("FCM 토큰 삭제 완료");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "알림이 비활성화되었습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("FCM 구독 해제 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "알림 비활성화에 실패했습니다.");

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 알림 목록 조회 API
     */
    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> getNotifications(
            @AuthenticationPrincipal Customer customer,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("알림 목록 조회 - 고객번호: {}, page: {}, size: {}", customer.getCustomerNo(), page, size);

        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationMessage> results = notificationMessageRepository.findByCustomer(customer, pageable);

        List<NotificationMessageDto> dtoList = results.getContent().stream()
                .map(msg -> NotificationMessageDto.builder()
                        .messageId(msg.getMessageId())
                        .title(msg.getTitle())
                        .body(msg.getBody())
                        .clickActionUrl(msg.getClickActionUrl())
                        .isRead(msg.getIsRead())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", dtoList);
        response.put("totalElements", results.getTotalElements());
        response.put("totalPages", results.getTotalPages());
        response.put("currentPage", results.getNumber());
        response.put("hasNext", results.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * 미읽음 알림 개수 조회 API
     */
    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@AuthenticationPrincipal Customer customer) {

        long count = notificationMessageRepository.countByCustomerAndIsRead(customer, "off");

        Map<String, Object> response = new HashMap<>();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    /**
     * 모든 알림 읽음 처리 API
     */
    @PostMapping("/notifications/read-all")
    @Transactional
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal Customer customer) {

        log.info("모든 알림 읽음 처리 - 고객번호: {}", customer.getCustomerNo());

        long updated = queryFactory.update(notificationMessage)
                .set(notificationMessage.isRead, "on")
                .where(notificationMessage.customer.customerNo.eq(customer.getCustomerNo())
                        .and(notificationMessage.isRead.eq("off")))
                .execute();

        log.info("읽음 처리 완료 - {}건", updated);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("updatedCount", updated);
        response.put("message", "모든 알림을 읽음으로 표시했습니다.");

        return ResponseEntity.ok(response);
    }
}

