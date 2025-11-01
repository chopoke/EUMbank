// src/main/java/com/boot/eumbank/foreign/controller/ForeignExchangeController.java
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.foreign.dto.FxExchangeCalcRespDto;
import com.boot.eumbank.foreign.dto.FxExchangeReqDto;
import com.boot.eumbank.foreign.dto.FxExchangeRespDto;
import com.boot.eumbank.foreign.repo.ForeignHistoryRepo;
import com.boot.eumbank.foreign.service.ForeignExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/foreign/exchange")
@RequiredArgsConstructor
@Slf4j
public class ForeignExchangeController {

    private final ForeignExchangeService exchangeService;
    private final ForeignHistoryRepo historyRepo;
    private final CustomerRepo customerRepo;

    /* ----------------------- 유틸: 입력 정규화 ----------------------- */

    /** "JPY(100)" → "JPY" */
    private static String toIso3(String cur) {
        if (cur == null) return null;
        String s = cur.trim().toUpperCase(Locale.ROOT);
        int i = s.indexOf('(');
        return (i > 0) ? s.substring(0, i) : s;
    }

    /** null-세이프 trim */
    private static String ntrim(String s) {
        return (s == null) ? null : s.trim();
    }

    /** 숫자/하이픈 섞인 계좌표기 통일 (여기선 단순 trim) */
    private static String normalizeAccount(String acc) {
        return ntrim(acc);
    }

    /** 요청 DTO 정규화 */
    private static void normalizeReq(FxExchangeReqDto req) {
        req.setFromCurUnit(toIso3(req.getFromCurUnit()));
        req.setToCurUnit(toIso3(req.getToCurUnit()));
        if (req.getTransactionType() != null) {
            req.setTransactionType(req.getTransactionType().trim().toUpperCase(Locale.ROOT));
        }
        req.setFromAccountNo(normalizeAccount(req.getFromAccountNo()));
        req.setToAccountNo(normalizeAccount(req.getToAccountNo()));
        req.setMemo(ntrim(req.getMemo()));
    }

    /* ----------------------- 공통 응답 헬퍼 ----------------------- */

    private static ResponseEntity<Map<String, Object>> bad(String msg) {
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }

    private static ResponseEntity<Map<String, Object>> error(String msg) {
        return ResponseEntity.internalServerError().body(Map.of("message", msg));
    }

    /* ----------------------- 엔드포인트 ----------------------- */

    /** 환전 계산 (미리보기) */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateExchange(@Valid @RequestBody FxExchangeReqDto reqDto) {
        normalizeReq(reqDto);
        log.info("[FX] calculate req (normalized): {}", reqDto);
        try {
            if (reqDto.getFromCurUnit() == null || reqDto.getToCurUnit() == null) {
                return bad("통화코드가 유효하지 않습니다.");
            }
            if (reqDto.getFxAmount() == null || reqDto.getFxAmount().signum() <= 0) {
                return bad("환전 금액이 올바르지 않습니다.");
            }

            FxExchangeCalcRespDto result = exchangeService.calculateExchange(reqDto);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("[FX] calculate fail: {}", e.getMessage());
            return bad(e.getMessage());
        } catch (Exception e) {
            log.error("[FX] calculate unexpected error", e);
            return error("서버 오류가 발생했습니다.");
        }
    }

    /** 환전 신청 (거래 실행) */
    @PostMapping
    public ResponseEntity<?> submitExchange(@Valid @RequestBody FxExchangeReqDto reqDto) {
        normalizeReq(reqDto);
        log.info("[FX] submit req (normalized): {}", reqDto);
        try {
            if (reqDto.getFromCurUnit() == null || reqDto.getToCurUnit() == null) {
                return bad("통화코드가 유효하지 않습니다.");
            }
            if (reqDto.getFxAmount() == null || reqDto.getFxAmount().signum() <= 0) {
                return bad("환전 금액이 올바르지 않습니다.");
            }
            if (reqDto.getFromAccountNo() == null || reqDto.getFromAccountNo().isBlank()) {
                return bad("출금 계좌번호가 필요합니다.");
            }
            if (reqDto.getToAccountNo() == null || reqDto.getToAccountNo().isBlank()) {
                return bad("입금 계좌번호가 필요합니다.");
            }

            FxExchangeRespDto result = exchangeService.exchange(reqDto);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("[FX] submit fail: {}", e.getMessage());
            return bad(e.getMessage());
        } catch (Exception e) {
            log.error("[FX] submit unexpected error", e);
            return error("서버 오류가 발생했습니다.");
        }
    }

    /** 환전 내역 조회 */
    @GetMapping("/history")
    public ResponseEntity<?> listHistory(
            @RequestParam(name = "cNo", required = false) Integer cNo,
            @RequestParam(name = "customerNo", required = false) Integer customerNo,
            Authentication auth
    ) {
        Integer key = (cNo != null) ? cNo : customerNo;

        // 로그인되어 있고 key가 비어 있으면 principal에서 추론
        if (key == null && auth != null && auth.isAuthenticated()) {
            key = resolveCustomerNoFromAuth(auth);
        }

        if (key == null) {
            log.info("[FX] history req without cNo/principal -> []");
            return ResponseEntity.ok(List.of()); // 필요 시 401로 변경 가능
        }

        var list = historyRepo.findByCNoOrderByFhOrderedAtDesc(key);
        log.info("[FX] history req cNo={} -> {} rows", key, list.size());

        var body = list.stream().map(h -> Map.of(
                "exId",      h.getFhExId(),
                "eventType", h.getFhEventType(),    // SELL/BUY/...
                "status",    h.getFhStatus(),       // REQUESTED/COMPLETED/...
                "curCode",   h.getFhFxCurCode(),
                "fxAmt",     h.getFhFxAmtFc(),
                "amtKrw",    h.getFhAmtKrw(),
                "rate",      h.getFhFxRateApplied(),
                "orderedAt", h.getFhOrderedAt()
        )).toList();

        return ResponseEntity.ok(body);
    }

    /** 진단: 현재 로그인으로부터 cNo 추론 결과 확인 */
    @GetMapping("/_whoami")
    public ResponseEntity<?> whoami(Authentication auth) {
        Integer cno = resolveCustomerNoFromAuth(auth);
        String principalType = (auth != null && auth.getPrincipal() != null)
                ? auth.getPrincipal().getClass().getName() : "null";
        return ResponseEntity.ok(Map.of(
                "principalType", principalType,
                "authName", (auth != null ? auth.getName() : null),
                "resolvedCNo", cno
        ));
    }

    /* ===== helper: principal -> cNo ===== */
    private Integer resolveCustomerNoFromAuth(Authentication auth) {
        try {
            if (auth == null) return null;

            Object p = auth.getPrincipal();
            log.info("[FX] principal class = {}", (p == null ? "null" : p.getClass().getName()));

            // 1) 엔터티가 바로 실린 경우
            if (p instanceof Customer c) {
                log.info("[FX] principal=Customer, customerNo={}", c.getCustomerNo());
                return c.getCustomerNo();
            }

            // 2) Spring Security UserDetails
            if (p instanceof UserDetails ud) {
                String u = ud.getUsername();
                log.info("[FX] principal=UserDetails, username={}", u);
                return customerRepo.findByUserId(u)
                        .map(Customer::getCustomerNo)
                        .orElse(null);
            }

            // 3) 단순 문자열(username) 또는 auth.getName()
            String username = (p instanceof String s) ? s : auth.getName();
            log.info("[FX] principal=StringOrName, username={}", username);
            if (username != null && !username.isBlank()) {
                return customerRepo.findByUserId(username)
                        .map(Customer::getCustomerNo)
                        .orElse(null);
            }

            // 4) JWT를 Map 형태로 담는 경우 (환경에 따라 키가 다름)
            if (p instanceof Map<?, ?> raw) {
                Object uid = firstNonNull(
                        raw.get("user_name"),
                        raw.get("preferred_username"),
                        raw.get("username"),
                        raw.get("sub"),
                        raw.get("uid")
                );
                log.info("[FX] principal=Map, extracted uid={}", uid);
                if (uid != null) {
                    return customerRepo.findByUserId(String.valueOf(uid))
                            .map(Customer::getCustomerNo)
                            .orElse(null);
                }
            }
        } catch (Exception e) {
            log.warn("[FX] resolve cNo from principal failed: {}", e.toString());
        }
        return null;
    }

    /** varargs 중 첫 번째 non-null 반환 */
    @SafeVarargs
    private static <T> T firstNonNull(T... values) {
        if (values == null) return null;
        for (T v : values) if (v != null) return v;
        return null;
    }
}
