package com.boot.eumbank.spot.controller;

import com.boot.eumbank.spot.dto.GoldTblDto;
import com.boot.eumbank.spot.dto.GoldCustomerDto;
import com.boot.eumbank.spot.dto.GoldProductDto;
import com.boot.eumbank.spot.model.GoldTbl;
import com.boot.eumbank.spot.service.trading.TradingService;
import com.boot.eumbank.spot.service.SpotAccountService;
import com.boot.eumbank.account.open.entity.account.Account;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
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
    private final SpotAccountService spotAccountService;

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
        try {
            GoldTbl transaction = tradingService.buyMetal(customerNo, productId, quantity, walletName, walletPin);
            GoldTblDto dto = tradingService.toGoldTblDto(transaction);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("매수 처리 중 오류: customerNo={}, productId={}, error={}", customerNo, productId, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            errorResult.put("errorType", e.getClass().getSimpleName());
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
            GoldTbl transaction = tradingService.sellMetal(customerNo, productId, quantity, walletName, walletPin);
            GoldTblDto dto = tradingService.toGoldTblDto(transaction);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("매도 처리 중 오류: customerNo={}, productId={}, error={}", customerNo, productId, e.getMessage());
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
            Map<String, Object> result = tradingService.getCustomerTransactionsDtoWithPagingAndSummary(
                customerNo, pageable, transactionType, metalCode, walletName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("거래내역 페이징 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 고객 잔고 조회 (계좌 + 지갑)
     */
    @GetMapping("/balance/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerBalance(
            @PathVariable Long customerNo,
            @RequestParam(required = false) Integer accountNo) {
        try {
            Map<String, Object> result = tradingService.getCustomerBalance(customerNo, accountNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("잔고 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "잔고 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 고객의 입출금 계좌 목록 조회
     */
    @GetMapping("/accounts/{customerNo}/deposit")
    public ResponseEntity<List<Map<String, Object>>> getDepositAccounts(@PathVariable Long customerNo) {
        try {
            List<Account> accounts = spotAccountService.getActiveDepositAccountsByCustomerNo(customerNo.intValue());
            
            if (accounts == null || accounts.isEmpty()) {
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
            
            List<Map<String, Object>> accountList = accounts.stream()
                    .map(account -> {
                        Map<String, Object> accountInfo = new HashMap<>();
                        accountInfo.put("aNo", account.getANo());
                        accountInfo.put("accountNo", account.getAccountNo());
                        accountInfo.put("accountType", account.getAccountType());
                        accountInfo.put("balance", account.getBalance());
                        accountInfo.put("nickname", account.getNickname());
                        accountInfo.put("status", account.getStatus());
                        return accountInfo;
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(accountList);
        } catch (Exception e) {
            log.error("입출금 계좌 목록 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }

    /**
     * 상품 목록 조회 (활성화된 금/은 상품)
     */
    @GetMapping("/products")
    public ResponseEntity<?> getProducts() {
        try {
            return ResponseEntity.ok(tradingService.getAllProductsDto());
        } catch (Exception e) {
            log.error("상품 목록 조회 중 오류: {}", e.getMessage());
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
            GoldProductDto product = tradingService.getProductDto(productId);
            if (product == null) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "상품을 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(errorResult);
            }
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            log.error("상품 상세 조회 중 오류: productId={}, error={}", productId, e.getMessage());
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
            GoldCustomerDto customer = tradingService.getCustomerInfoDto(customerNo);
            if (customer == null) {
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("error", "고객 정보를 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(errorResult);
            }
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            log.error("고객 정보 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "고객 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    
    /**
     * 고객 지갑 목록 조회 (DTO 반환)
     */
    @GetMapping("/wallets/{customerNo}")
    public ResponseEntity<Map<String, Object>> getCustomerWallets(@PathVariable Long customerNo) {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("wallets", tradingService.getCustomerWalletsDto(customerNo));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("지갑 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", "지갑 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 지갑 생성
     */
    @PostMapping("/wallets")
    public ResponseEntity<Map<String, Object>> createWallet(@RequestBody Map<String, Object> requestBody) {
        try {
            Integer customerNo = (Integer) requestBody.get("customerNo");
            String walletName = (String) requestBody.get("walletName");
            String walletPin = (String) requestBody.get("walletPin");
            
            Map<String, Object> result = tradingService.createWallet(customerNo, walletName, walletPin);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("지갑 생성 중 오류: customerNo={}, error={}", requestBody.get("customerNo"), e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "지갑 생성 중 오류가 발생했습니다: " + e.getMessage());
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
            @RequestParam(required = false) String pin,
            @RequestParam(required = false) Integer accountNo) {
        try {
            Map<String, Object> result = tradingService.transferToTradingAccount(customerNo, amount, walletName, pin, accountNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("계좌 → 현물통장 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
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
            @RequestParam(required = false) String pin,
            @RequestParam(required = false) Integer accountNo) {
        try {
            Map<String, Object> result = tradingService.transferFromTradingAccount(customerNo, amount, walletName, pin, accountNo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("현물통장 → 계좌 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "이체 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 지갑 PIN 검증
     */
    @PostMapping("/wallets/validate-pin")
    public ResponseEntity<Map<String, Object>> validateWalletPin(
            @RequestParam Integer customerNo,
            @RequestParam String walletName,
            @RequestParam String pin) {
        try {
            boolean isValid = tradingService.validateWalletPin(customerNo, walletName, pin);
            Map<String, Object> result = new HashMap<>();
            result.put("success", isValid);
            result.put("message", isValid ? "PIN이 올바릅니다." : "PIN이 올바르지 않습니다.");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("지갑 PIN 검증 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 검증 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 지갑 PIN 업데이트
     */
    @PostMapping("/wallets/update-pin")
    public ResponseEntity<Map<String, Object>> updateWalletPin(
            @RequestParam Integer customerNo,
            @RequestParam String walletName,
            @RequestParam String oldPin,
            @RequestParam String newPin) {
        try {
            Map<String, Object> result = tradingService.updateWalletPin(customerNo, walletName, oldPin, newPin);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("지갑 PIN 업데이트 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
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
            Map<String, Object> result = tradingService.recoverWalletPin(customerNo, walletName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("PIN 복구 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 복구 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    /**
     * 지갑 삭제
     */
    @DeleteMapping("/wallets/{walletId}")
    public ResponseEntity<Map<String, Object>> deleteWallet(@PathVariable Long walletId) {
        try {
            Map<String, Object> result = new HashMap<>();
            boolean success = tradingService.deleteWallet(walletId);
            if (success) {
                result.put("success", true);
                result.put("message", "지갑이 삭제되었습니다.");
            } else {
                result.put("success", false);
                result.put("message", "지갑 삭제에 실패했습니다.");
                log.warn("지갑 삭제 실패: walletId={}", walletId);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("지갑 삭제 중 오류: walletId={}, error={}", walletId, e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "지갑 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }
}
