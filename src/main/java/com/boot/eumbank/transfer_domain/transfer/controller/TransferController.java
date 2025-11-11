package com.boot.eumbank.transfer_domain.transfer.controller;

import com.boot.eumbank.transfer_domain.transfer.dto.*;
import com.boot.eumbank.transfer_domain.transfer.service.TransferService;
import com.boot.eumbank.transfer_domain.transfer.exception.AccountNotFoundException;
import com.boot.eumbank.transfer_domain.transfer.exception.AccountStatusException;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

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
    public ResponseEntity<Map<String, Object>> transfer(@Valid @RequestBody TransferRequestDto request, @AuthenticationPrincipal Customer customer) {
        log.info("일반 이체 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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
    public ResponseEntity<Map<String, Object>> reserveTransfer(@Valid @RequestBody TransferOrderDto request, @AuthenticationPrincipal Customer customer) {
        log.info("=== 예약이체 API 시작 ===");
        log.info("요청 데이터: {}", request);
        log.info("고객 정보: {}", customer != null ? customer.getCId() : "null");
        log.info("예약 이체 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}, 예약시간: {}", 
                request.getAccountNo(), request.getDestAccountNo(), request.getAmount(), request.getStartAt());
        
        try {
            log.info("1. 인증 확인 시작");
            if (customer == null) {
                log.error("인증 실패: 고객 정보가 null입니다.");
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            log.info("1. 인증 확인 완료 - 고객ID: {}", customer.getCId());
            
            log.info("2. TransferService.createReserveTransfer 호출 시작");
            TransferOrderDto response = transferService.createReserveTransfer(request);
            log.info("2. TransferService.createReserveTransfer 호출 완료 - 응답: {}", response);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "예약 이체가 등록되었습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            log.info("=== 예약이체 API 성공 완료 ===");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("=== 예약이체 API 실패 ===");
            log.error("예약 이체 등록 중 오류 발생", e);
            log.error("에러 타입: {}", e.getClass().getSimpleName());
            log.error("에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("원인 에러: {}", e.getCause().getMessage());
            }
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [자동이체 API]
     * - 매월 지정일에 반복 실행되는 예약이체 여러개 등록
     * - POST /api/transfer/auto
     */
    @PostMapping("/auto")
    public ResponseEntity<Map<String, Object>> autoTransfer(@Valid @RequestBody AutoTransferRequestDto request, @AuthenticationPrincipal Customer customer) {
        log.info("=== 자동이체 API 시작 ===");
        log.info("요청 데이터: {}", request);
        log.info("고객 정보: {}", customer != null ? customer.getCId() : "null");
        log.info("자동이체 요청 - 출금계좌: {}, 수취계좌: {}, 1회당 금액: {}, 시작: {}-{}, 매월: {}일, 횟수: {}회", 
                request.getFromAccountNo(), request.getDestAccountNo(), request.getAmount(), 
                request.getStartYear(), request.getStartMonth(), request.getDayOfMonth(), request.getRepeatCount());
        
        try {
            log.info("1. 인증 확인 시작");
            if (customer == null) {
                log.error("인증 실패: 고객 정보가 null입니다.");
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            log.info("1. 인증 확인 완료 - 고객ID: {}", customer.getCId());
            
            log.info("2. TransferService.createAutoTransfer 호출 시작");
            AutoTransferResponseDto response = transferService.createAutoTransfer(request);
            log.info("2. TransferService.createAutoTransfer 호출 완료 - 응답: {}", response);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", response.getMessage());
            result.put("timestamp", LocalDateTime.now().toString());
            
            log.info("=== 자동이체 API 성공 완료 ===");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("=== 자동이체 API 실패 ===");
            log.error("자동이체 등록 중 오류 발생", e);
            log.error("에러 타입: {}", e.getClass().getSimpleName());
            log.error("에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("원인 에러: {}", e.getCause().getMessage());
            }
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [다건 이체 API]
     * - 여러 수취인에게 일괄 이체
     * - POST /api/transfer/bulk
     */
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkTransfer(@Valid @RequestBody BulkTransferRequestDto request, @AuthenticationPrincipal Customer customer) {
        log.info("다건 이체 요청 - 출금계좌: {}, 수취인 수: {}", 
                request.getFromAccountNo(), request.getRecipients().size());
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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
            @AuthenticationPrincipal Customer customer,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        log.info("이체 내역 조회 - 계좌: {}, 페이지: {}, 크기: {}", accountNo, page, size);
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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
    public ResponseEntity<Map<String, Object>> getReserveTransfers(@PathVariable Integer accountNo, @AuthenticationPrincipal Customer customer) {
        log.info("예약 이체 목록 조회 - 계좌: {}", accountNo);
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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
    public ResponseEntity<Map<String, Object>> cancelReserveTransfer(@PathVariable Integer orderId, @AuthenticationPrincipal Customer customer) {
        log.info("예약 이체 취소 - 주문ID: {}", orderId);
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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
     * [예약/자동 이체 상태 변경 API]
     * - 예약/자동 이체를 해지할 때 사용 (현재 CANCELLED만 지원)
     * - PATCH /api/transfer/orders/status
     */
    @PatchMapping("/orders/status")
    public ResponseEntity<Map<String, Object>> updateTransferOrderStatus(@RequestBody TransferOrderStatusUpdateRequest request,
                                                                         @AuthenticationPrincipal Customer customer) {
        log.info("예약/자동 이체 상태 변경 요청 - 주문 IDs: {}, 목표 상태: {}", request.getOrderIds(), request.getStatus());

        if (customer == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "인증이 필요합니다.");
            return ResponseEntity.status(401).body(result);
        }

        transferService.updateTransferOrderStatus(request.getOrderIds(), request.getStatus());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "예약 이체 상태가 변경되었습니다.");
        result.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(result);
    }

    /**
     * [이체 확인 API]
     * - 이체 전 최종 확인 (잔액, 한도 등)
     * - POST /api/transfer/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmTransfer(@Valid @RequestBody TransferConfirmDto request, @AuthenticationPrincipal Customer customer) {
        log.info("이체 확인 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
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

    /**
     * [계좌 목록 조회 API]
     * - 로그인한 사용자의 계좌 목록 조회
     * - GET /api/transfer/accounts
     */
    @GetMapping("/accounts")
    public ResponseEntity<Map<String, Object>> getAccounts(@AuthenticationPrincipal Customer customer) {
        log.info("계좌 목록 조회 요청 - 고객: {}", customer != null ? customer.getCId() : "null");
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                result.put("data", Map.of("accounts", List.of()));
                return ResponseEntity.status(401).body(result);
            }
            
            Object accounts = transferService.getAccounts();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", accounts);
            result.put("message", "계좌 목록을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("계좌 목록 조회 중 오류 발생", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "계좌 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            result.put("data", Map.of("accounts", List.of()));
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * [계좌 잔액 조회 API]
     * - 특정 계좌의 잔액 조회
     * - GET /api/transfer/accounts/{accountNo}/balance
     */
    @GetMapping("/accounts/{accountNo}/balance")
    public ResponseEntity<Map<String, Object>> getAccountBalance(
            @PathVariable Integer accountNo,
            @AuthenticationPrincipal Customer customer) {
        log.info("계좌 잔액 조회 요청 - 계좌: {}, 고객: {}", accountNo, customer != null ? customer.getCId() : "null");
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
            Long balance = transferService.getAccountBalance(accountNo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", Map.of("accountNo", accountNo, "balance", balance));
            result.put("message", "계좌 잔액을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("계좌 잔액 조회 중 오류 발생", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "계좌 잔액 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * [은행 목록 조회 API]
     * - 이체 가능한 은행 목록 조회
     * - GET /api/transfer/banks
     */
    @GetMapping("/banks")
    public ResponseEntity<Map<String, Object>> getBanks() {
        log.info("은행 목록 조회 요청");
        
        try {
            // 하드코딩된 은행 목록 (신규 입력 탭용)
            Map<String, Object> banks = Map.of(
                "banks", List.of(
                    Map.of("code", "EUM", "name", "이음은행", "logo", "/images/eum.png"),
                    Map.of("code", "001", "name", "국민은행", "logo", "/images/kb.png"),
                    Map.of("code", "002", "name", "신한은행", "logo", "/images/shinhan.png"),
                    Map.of("code", "003", "name", "우리은행", "logo", "/images/woori.png"),
                    Map.of("code", "004", "name", "하나은행", "logo", "/images/hana.png"),
                    Map.of("code", "005", "name", "농협은행", "logo", "/images/nh.png"),
                    Map.of("code", "006", "name", "기업은행", "logo", "/images/ibk.png"),
                    Map.of("code", "007", "name", "새마을금고", "logo", "/images/smg.png"),
                    Map.of("code", "008", "name", "신협", "logo", "/images/sc.png"),
                    Map.of("code", "009", "name", "우체국", "logo", "/images/post.png"),
                    Map.of("code", "010", "name", "카카오뱅크", "logo", "/images/kakao.png"),
                    Map.of("code", "011", "name", "토스뱅크", "logo", "/images/toss.png"),
                    Map.of("code", "012", "name", "케이뱅크", "logo", "/images/kbank.png")
                )
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", banks);
            result.put("message", "은행 목록을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("은행 목록 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [수취인 조회 API]
     * - 특정 은행/계좌의 수취인 정보 조회
     * - POST /api/transfer/account-holder
     */
    @PostMapping("/account-holder")
    public ResponseEntity<Map<String, Object>> getAccountHolder(
            @RequestBody Map<String, String> request) {
        String bankCode = request.get("bankCode");
        String accountNo = request.get("accountNumber");
        log.info("수취인 조회 요청 - 은행코드: {}, 계좌번호: {}", bankCode, accountNo);
        
        try {
            // 실제 DB에서 예금주명 조회
            String accountHolder = transferService.getActualAccountHolderName(accountNo, bankCode);
            
            Map<String, Object> holder = Map.of(
                "bankCode", bankCode,
                "accountNo", accountNo,
                "accountHolder", accountHolder,
                "isValid", true
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", holder);
            result.put("message", "수취인 정보를 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (AccountNotFoundException e) {
            log.warn("계좌를 찾을 수 없음 - 계좌번호: {}, 은행: {}", accountNo, bankCode);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "존재하지 않는 계좌입니다.");
            result.put("errorCode", "ACCOUNT_NOT_FOUND");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
            
        } catch (AccountStatusException e) {
            log.warn("계좌 상태 이상 - 계좌번호: {}, 은행: {}", accountNo, bankCode);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "거래 불가능한 계좌입니다.");
            result.put("errorCode", "ACCOUNT_STATUS_ERROR");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            
        } catch (Exception e) {
            log.error("수취인 조회 중 오류 발생", e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "계좌 조회 중 오류가 발생했습니다.");
            result.put("errorCode", "INTERNAL_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

    /**
     * [최근 수취인 조회 API]
     * - 특정 계좌의 최근 이체 수취인 목록 조회
     * - GET /api/transfer/recipients/{accountNo}
     */
    @GetMapping("/recipients/{accountNo}")
    public ResponseEntity<Map<String, Object>> getRecentRecipients(@PathVariable Integer accountNo, @AuthenticationPrincipal Customer customer) {
        log.info("최근 수취인 조회 요청 - 계좌: {}", accountNo);
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
            List<Map<String, Object>> recipients = transferService.getRecentRecipients(accountNo);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", recipients);
            result.put("count", recipients.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("최근 수취인 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [즐겨찾기 계좌 조회 API]
     * - 로그인한 사용자의 즐겨찾기 계좌 목록 조회
     * - GET /api/transfer/favorites
     */
    @GetMapping("/favorites")
    public ResponseEntity<Map<String, Object>> getFavoriteAccounts(@AuthenticationPrincipal Customer customer) {
        log.info("즐겨찾기 계좌 조회 요청");
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
            List<Map<String, Object>> favorites = transferService.getFavoriteAccounts();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", Map.of("favorites", favorites));
            result.put("message", "즐겨찾기 계좌 목록을 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("즐겨찾기 계좌 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }

    /**
     * [이체 수수료 조회 API]
     * - 이체 수수료 계산
     * - POST /api/transfer/fee
     */
    @PostMapping("/fee")
    public ResponseEntity<Map<String, Object>> getTransferFee(@Valid @RequestBody TransferFeeRequestDto request, @AuthenticationPrincipal Customer customer) {
        log.info("이체 수수료 조회 요청 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        try {
            if (customer == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "인증이 필요합니다.");
                return ResponseEntity.status(401).body(result);
            }
            
            Map<String, Object> fee = transferService.calculateTransferFee(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", fee);
            result.put("message", "이체 수수료를 조회했습니다.");
            result.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("이체 수수료 조회 중 오류 발생", e);
            throw e; // GlobalExceptionHandler에서 처리
        }
    }
}
