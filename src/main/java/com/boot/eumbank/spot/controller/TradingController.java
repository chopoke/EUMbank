package com.boot.eumbank.spot.controller;

import com.boot.eumbank.spot.dto.GoldTblDto;
import com.boot.eumbank.spot.dto.GoldCustomerDto;
import com.boot.eumbank.spot.dto.GoldProductDto;
import com.boot.eumbank.spot.model.GoldTbl;
import com.boot.eumbank.spot.service.trading.TradingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 현물 거래 주문 컨트롤러
 * - 거래 주문 기능: 매수/매도, 골드바/실버바 선택 가능
 * - 거래내역 페이징: 실제 DB 페이징 (20개씩), 필터링 지원, 엑셀 다운로드
 * - 기술 스택: Spring Boot + JPA + QueryDSL + Spring Data JPA
 * - API: POST /api/trading/buy, /api/trading/sell, GET /api/trading/transactions/paging/{customerNo}
 */
@RestController
@RequestMapping("/api/trading")
@RequiredArgsConstructor
@Slf4j
public class TradingController {

    private final TradingService tradingService;

    /**
     * 금/은 매수 처리 - 골드바/실버바 선택 가능
     */
    @PostMapping("/buy")
    public ResponseEntity<?> buyMetal(
            @RequestParam Integer customerNo,
            @RequestParam String productId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String walletName,
            @RequestParam String walletPin) {
        
        log.info("=== 매수 요청 시작 ===");
        log.info("요청 파라미터 - customerNo: {}, productId: {}, quantity: {}, walletName: {}, walletPin: {}", 
                customerNo, productId, quantity, walletName, walletPin);
        
        try {
            log.info("TradingService.buyMetal 호출 시작");
            GoldTbl transaction = tradingService.buyMetal(customerNo, productId, quantity, walletName, walletPin);
            log.info("TradingService.buyMetal 호출 완료 - transactionId: {}", transaction.getGId());
            
            log.info("GoldTblDto 변환 시작");
            GoldTblDto dto = tradingService.toGoldTblDto(transaction);
            log.info("GoldTblDto 변환 완료 - dtoId: {}", dto.gId);
            
            log.info("=== 매수 성공 - 응답 반환 ===");
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("=== 매수 처리 중 오류 발생 ===");
            log.error("오류 메시지: {}", e.getMessage());
            log.error("오류 클래스: {}", e.getClass().getSimpleName());
            log.error("스택 트레이스:", e);
            
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            errorResult.put("errorType", e.getClass().getSimpleName());
            
            log.error("=== 오류 응답 반환 ===");
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 금/은 매도 처리 - 골드바/실버바 선택 가능
     */
    @PostMapping("/sell")
    public ResponseEntity<?> sellMetal(
            @RequestParam Integer customerNo,
            @RequestParam String productId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String walletName,
            @RequestParam String walletPin) {
        try {
            log.info("매도 요청 받음: customerNo={}, productId={}, quantity={}, walletName={}, walletPin={}", 
                    customerNo, productId, quantity, walletName, walletPin);
            
            GoldTbl transaction = tradingService.sellMetal(customerNo, productId, quantity, walletName, walletPin);
            GoldTblDto dto = tradingService.toGoldTblDto(transaction);
            
            log.info("매도 성공: transactionId={}", dto.gId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("매도 처리 중 오류: customerNo={}, productId={}, quantity={}, walletName={}, error={}", 
                    customerNo, productId, quantity, walletName, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 고객 거래내역 조회
     */
    @GetMapping("/transactions/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerTransactions(@PathVariable Long customerNo) {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("transactions", tradingService.getCustomerTransactionsDto(customerNo));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("거래내역 조회 중 오류: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 거래내역 페이징 조회 - 실제 DB 페이징 (20개씩), 필터링 지원, 엑셀 다운로드
     */
    @GetMapping("/transactions/paging/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerTransactionsWithPaging(
            @PathVariable Long customerNo,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String metalCode,
            @RequestParam(required = false) String walletName,
            @PageableDefault(size = 20, sort = "gPurchasedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        try {
            log.info("=== 거래내역 페이징 조회 및 총합 시작 ===");
            log.info("요청 파라미터 - customerNo: {}, transactionType: {}, metalCode: {}, walletName: {}", 
                    customerNo, transactionType, metalCode, walletName);
            log.info("페이징 정보 - page: {}, size: {}, sort: {}", 
                    pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
            
            Map<String, Object> result = tradingService.getCustomerTransactionsDtoWithPagingAndSummary(
                customerNo, pageable, transactionType, metalCode, walletName);
            
            @SuppressWarnings("unchecked")
            Page<GoldTblDto> transactions = (Page<GoldTblDto>) result.get("transactions");
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) result.get("summary");
            
            log.info("거래내역 조회 결과 - 총 개수: {}, 현재 페이지: {}, 총 페이지: {}", 
                    transactions.getTotalElements(), transactions.getNumber(), transactions.getTotalPages());
            log.info("거래내역 데이터 개수: {}", transactions.getContent().size());
            log.info("총합 정보: {}", summary);
            
            if (transactions.getContent().isEmpty()) {
                log.warn("거래내역이 비어있습니다. customerNo: {}", customerNo);
            } else {
                log.info("첫 번째 거래내역: {}", transactions.getContent().get(0));
            }
            
            log.info("=== 거래내역 페이징 조회 및 총합 완료 ===");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("=== 거래내역 페이징 조회 중 오류 발생 ===");
            log.error("오류 메시지: {}", e.getMessage());
            log.error("스택 트레이스:", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 고객 잔고 조회 (계좌 + 월렛)
     */
    @GetMapping("/balance/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerBalance(@PathVariable Long customerNo) {
        try {
            log.info("잔고 조회 요청: customerNo={}", customerNo);
            Map<String, Object> result = tradingService.getCustomerBalance(customerNo);
            log.info("잔고 조회 성공: customerNo={}", customerNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("잔고 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "잔고 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 상품 목록 조회 (활성화된 금/은 상품)
     */
    @GetMapping("/products")
    public ResponseEntity<?> getProducts() {
        try {
            log.info("상품 목록 조회 요청");
            return ResponseEntity.ok(tradingService.getAllProductsDto());
        } catch (Exception e) {
            log.error("상품 목록 조회 중 오류: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "상품 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    
    /**
     * 상품 상세 조회
     */
    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProduct(@PathVariable String productId) {
        try {
            log.info("상품 상세 조회 요청: productId={}", productId);
            GoldProductDto product = tradingService.getProductDto(productId);
            if (product == null) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "상품을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(errorResult);
            }
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            log.error("상품 상세 조회 중 오류: productId={}, error={}", productId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "상품 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    
    /**
     * 고객 정보 조회 (현물 고객 보유 현황)
     */
    @GetMapping("/customer/{customerNo}")
    public ResponseEntity<?> getCustomerInfo(@PathVariable Long customerNo) {
        try {
            log.info("고객 정보 조회 요청: customerNo={}", customerNo);
            GoldCustomerDto customer = tradingService.getCustomerInfoDto(customerNo);
            if (customer == null) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "고객 정보를 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(errorResult);
            }
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            log.error("고객 정보 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "고객 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    
    /**
     * 고객 월렛 목록 조회 (DTO 반환)
     */
    @GetMapping("/wallets/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerWallets(@PathVariable Long customerNo) {
        try {
            log.info("월렛 조회 요청: customerNo={}", customerNo);
            Map<String, Object> result = new HashMap<>();
            result.put("wallets", tradingService.getCustomerWalletsDto(customerNo));
            log.info("월렛 조회 성공: customerNo={}", customerNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("월렛 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "월렛 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 월렛 생성
     */
    @PostMapping("/wallets")
    public ResponseEntity<Map<String, Object>> createWallet(@RequestBody Map<String, Object> requestBody) {
        try {
            Integer customerNo = (Integer) requestBody.get("customerNo");
            String walletName = (String) requestBody.get("walletName");
            String walletPin = (String) requestBody.get("walletPin");
            
            log.info("월렛 생성 요청: customerNo={}, walletName={}, walletPin={}", customerNo, walletName, walletPin);
            Map<String, Object> result = tradingService.createWallet(customerNo, walletName, walletPin);
            log.info("월렛 생성 성공: customerNo={}, walletName={}", customerNo, walletName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("월렛 생성 중 오류: requestBody={}, error={}", requestBody, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "월렛 생성 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 계좌에서 현물거래 통장으로 이체
     */
    @PostMapping("/transfer/in")
    public ResponseEntity<Map<String, Object>> transferToTradingAccount(
            @RequestParam Integer customerNo,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String walletName,
            @RequestParam(required = false) String pin) {
        try {
            log.info("계좌 → 현물거래통장 이체 요청: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            Map<String, Object> result = tradingService.transferToTradingAccount(customerNo, amount, walletName, pin);
            log.info("계좌 → 현물거래통장 이체 성공: customerNo={}", customerNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("계좌 → 현물거래통장 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "이체 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 현물거래 통장에서 계좌로 이체
     */
    @PostMapping("/transfer/out")
    public ResponseEntity<Map<String, Object>> transferFromTradingAccount(
            @RequestParam Integer customerNo,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String walletName,
            @RequestParam(required = false) String pin) {
        try {
            log.info("현물거래통장 → 계좌 이체 요청: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            Map<String, Object> result = tradingService.transferFromTradingAccount(customerNo, amount, walletName, pin);
            log.info("현물거래통장 → 계좌 이체 성공: customerNo={}", customerNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("현물거래통장 → 계좌 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "이체 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 월렛 PIN 검증
     */
    @PostMapping("/wallets/validate-pin")
    public ResponseEntity<Map<String, Object>> validateWalletPin(
            @RequestParam Integer customerNo,
            @RequestParam String walletName,
            @RequestParam String pin) {
        try {
            log.info("월렛 PIN 검증 요청: customerNo={}, walletName={}", customerNo, walletName);
            boolean isValid = tradingService.validateWalletPin(customerNo, walletName, pin);
            Map<String, Object> result = new HashMap<>();
            result.put("success", isValid);
            result.put("message", isValid ? "PIN이 올바릅니다." : "PIN이 올바르지 않습니다.");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("월렛 PIN 검증 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 검증 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 월렛 PIN 업데이트
     */
    @PostMapping("/wallets/update-pin")
    public ResponseEntity<Map<String, Object>> updateWalletPin(
            @RequestParam Integer customerNo,
            @RequestParam String walletName,
            @RequestParam String oldPin,
            @RequestParam String newPin) {
        try {
            log.info("월렛 PIN 업데이트 요청: customerNo={}, walletName={}", customerNo, walletName);
            Map<String, Object> result = tradingService.updateWalletPin(customerNo, walletName, oldPin, newPin);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("월렛 PIN 업데이트 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * PIN 분실 시 복구
     */
    @PostMapping("/wallets/recover-pin")
    public ResponseEntity<Map<String, Object>> recoverWalletPin(
            @RequestParam Integer customerNo,
            @RequestParam String walletName) {
        try {
            log.info("PIN 복구 요청: customerNo={}, walletName={}", customerNo, walletName);
            Map<String, Object> result = tradingService.recoverWalletPin(customerNo, walletName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("PIN 복구 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 복구 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 월렛 삭제
     */
    @DeleteMapping("/wallets/{walletId}")
    public ResponseEntity<Map<String, Object>> deleteWallet(@PathVariable Long walletId) {
        try {
            log.info("월렛 삭제 요청: walletId={}", walletId);
            Map<String, Object> result = new HashMap<>();
            boolean success = tradingService.deleteWallet(walletId);
            if (success) {
                result.put("success", true);
                result.put("message", "월렛이 삭제되었습니다.");
                log.info("월렛 삭제 성공: walletId={}", walletId);
            } else {
                result.put("success", false);
                result.put("message", "월렛 삭제에 실패했습니다.");
                log.warn("월렛 삭제 실패: walletId={}", walletId);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("월렛 삭제 중 오류: walletId={}, error={}", walletId, e.getMessage(), e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "월렛 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
