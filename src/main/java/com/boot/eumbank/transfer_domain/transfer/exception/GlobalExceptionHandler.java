package com.boot.eumbank.transfer_domain.transfer.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * [전역 예외 처리 핸들러]
 * - @RestControllerAdvice를 사용하여 모든 Controller의 예외를 한 곳에서 처리
 * - 커스텀 예외들을 적절한 HTTP 상태 코드와 메시지로 변환
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * [이체 예외 공통 처리]
     * - 모든 TransferException을 처리하는 공통 핸들러
     * - HTTP 400 Bad Request로 응답
     */
    @ExceptionHandler(TransferException.class)
    public ResponseEntity<Map<String, Object>> handleTransferException(TransferException ex) {
        log.warn("이체 예외 발생 - 코드: {}, 메시지: {}", ex.getErrorCode(), ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * [금액 유효성 예외 처리]
     * - 이체 금액이 유효하지 않을 때
     * - HTTP 400 Bad Request
     */
    @ExceptionHandler(InvalidAmountException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidAmountException(InvalidAmountException ex) {
        log.warn("금액 유효성 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * [계좌 상태 예외 처리]
     * - 계좌가 사용 불가능한 상태일 때
     * - HTTP 403 Forbidden
     */
    @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<Map<String, Object>> handleAccountStatusException(AccountStatusException ex) {
        log.warn("계좌 상태 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.FORBIDDEN.value());
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    /**
     * [잔액 부족 예외 처리]
     * - 계좌 잔액이 이체 금액보다 적을 때
     * - HTTP 402 Payment Required
     */
    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientBalanceException(InsufficientBalanceException ex) {
        log.warn("잔액 부족 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.PAYMENT_REQUIRED.value());
        
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(errorResponse);
    }

    /**
     * [이체 한도 초과 예외 처리]
     * - 1회/일일/월간 이체 한도 초과 시
     * - HTTP 429 Too Many Requests
     */
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleLimitExceededException(LimitExceededException ex) {
        log.warn("이체 한도 초과 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
    }

    /**
     * [비밀번호 불일치 예외 처리]
     * - 계좌 비밀번호가 틀렸을 때
     * - HTTP 401 Unauthorized
     */
    @ExceptionHandler(PasswordMismatchException.class)
    public ResponseEntity<Map<String, Object>> handlePasswordMismatchException(PasswordMismatchException ex) {
        log.warn("비밀번호 불일치 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * [자기 계좌 이체 예외 처리]
     * - 출금 계좌와 입금 계좌가 동일할 때
     * - HTTP 400 Bad Request
     */
    @ExceptionHandler(SameAccountTransferException.class)
    public ResponseEntity<Map<String, Object>> handleSameAccountTransferException(SameAccountTransferException ex) {
        log.warn("자기 계좌 이체 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * [계좌 없음 예외 처리]
     * - 요청한 계좌를 찾을 수 없을 때
     * - HTTP 404 Not Found
     */
    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAccountNotFoundException(AccountNotFoundException ex) {
        log.warn("계좌 없음 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * [계좌 한도 정보 없음 예외 처리]
     * - 계좌 한도 정보를 찾을 수 없을 때
     * - HTTP 404 Not Found
     */
    @ExceptionHandler(AccountLimitNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAccountLimitNotFoundException(AccountLimitNotFoundException ex) {
        log.warn("계좌 한도 정보 없음 예외 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * [인증 실패 예외 처리]
     * - JWT 인증 실패 또는 본인 계좌가 아닌 경우
     * - HTTP 401 Unauthorized
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedException(UnauthorizedException ex) {
        log.warn("인증 실패 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", "UNAUTHORIZED");
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * [IllegalArgumentException 처리]
     * - 기존 코드와의 호환성을 위해 유지
     * - HTTP 400 Bad Request
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("IllegalArgumentException 발생 - {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", "INVALID_ARGUMENT");
        errorResponse.put("error", ex.getMessage());
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * [일반 예외 처리]
     * - 예상하지 못한 모든 예외를 처리하는 최종 핸들러
     * - HTTP 500 Internal Server Error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        log.error("예상치 못한 예외 발생", ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("errorCode", "INTERNAL_SERVER_ERROR");
        errorResponse.put("error", "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}

