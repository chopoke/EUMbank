package com.boot.eumbank.transfer_domain.transfer.controller;

import com.boot.eumbank.transfer_domain.transfer.dto.*;
import com.boot.eumbank.transfer_domain.transfer.service.TransferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * [이체 컨트롤러]
 * - 이체 관련 모든 API 엔드포인트 제공
 * - 주요 기능:
 *   1) 일반 이체 (즉시 이체)
 *   2) 예약 이체 (스케줄 이체)
 *   3) 다건 이체 (일괄 이체)
 *   4) 이체 내역 조회
 *   5) 예약 이체 관리
 */
@RestController
@RequestMapping("/api/transfer")
@RequiredArgsConstructor
@Slf4j
public class TransferController {

    private final TransferService transferService;

    /**
     * [일반 이체 API]
     * - 즉시 이체 처리
     * - POST /api/transfer
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> transfer(@Valid @RequestBody TransferRequestDto request) {
        log.info("일반 이체 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        try {
            TransferResponseDto response = transferService.processTransfer(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "이체가 완료되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("이체 처리 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [예약 이체 API]
     * - 스케줄된 이체 등록
     * - POST /api/transfer/reserve
     */
    @PostMapping("/reserve")
    public ResponseEntity<Map<String, Object>> reserveTransfer(@Valid @RequestBody TransferOrderDto request) {
        log.info("예약 이체 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}, 예약시간: {}", 
                request.getAccountNo(), request.getDestAccountNo(), request.getAmount(), request.getStartAt());
        
        try {
            TransferOrderDto response = transferService.createReserveTransfer(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "예약 이체가 등록되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("예약 이체 등록 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [다건 이체 API]
     * - 여러 수취인에게 일괄 이체
     * - POST /api/transfer/bulk
     */
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkTransfer(@Valid @RequestBody BulkTransferRequestDto request) {
        log.info("다건 이체 요청 - 출금계좌: {}, 수취인 수: {}", 
                request.getFromAccountNo(), request.getRecipients().size());
        
        try {
            BulkTransferResponseDto response = transferService.processBulkTransfer(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "다건 이체가 완료되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("다건 이체 처리 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [이체 내역 조회 API]
     * - 계좌별 이체 내역 조회 (페이징)
     * - GET /api/transfer/history/{accountNo}
     */
    @GetMapping("/history/{accountNo}")
    public ResponseEntity<Map<String, Object>> getTransferHistory(
            @PathVariable Integer accountNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        log.info("이체 내역 조회 - 계좌: {}, 페이지: {}, 크기: {}", accountNo, page, size);
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TransferHistoryListDto> history = transferService.getTransferHistory(
                    accountNo, type, fromDate, toDate, pageable);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", history);
            result.put("message", "이체 내역을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("이체 내역 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [예약 이체 목록 조회 API]
     * - 계좌별 예약 이체 목록 조회
     * - GET /api/transfer/reserve/{accountNo}
     */
    @GetMapping("/reserve/{accountNo}")
    public ResponseEntity<Map<String, Object>> getReserveTransfers(@PathVariable Integer accountNo) {
        log.info("예약 이체 목록 조회 - 계좌: {}", accountNo);
        
        try {
            var reserves = transferService.getReserveTransfers(accountNo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", reserves);
            result.put("message", "예약 이체 목록을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("예약 이체 목록 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [예약 이체 취소 API]
     * - 등록된 예약 이체 취소
     * - DELETE /api/transfer/reserve/{orderId}
     */
    @DeleteMapping("/reserve/{orderId}")
    public ResponseEntity<Map<String, Object>> cancelReserveTransfer(@PathVariable Integer orderId) {
        log.info("예약 이체 취소 - 주문ID: {}", orderId);
        
        try {
            transferService.cancelReserveTransfer(orderId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "예약 이체가 취소되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("예약 이체 취소 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [이체 확인 API]
     * - 이체 전 최종 확인 (잔액, 한도 등)
     * - POST /api/transfer/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmTransfer(@Valid @RequestBody TransferConfirmDto request) {
        log.info("이체 확인 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        try {
            TransferConfirmDto response = transferService.confirmTransfer(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "이체 확인이 완료되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("이체 확인 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }
}
