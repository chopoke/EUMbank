// src/main/java/com/boot/eumbank/foreign/controller/ForeignExchangeController.java
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.foreign.dto.FxExchangeCalcRespDto;
import com.boot.eumbank.foreign.dto.FxExchangeReqDto;
import com.boot.eumbank.foreign.dto.FxExchangeRespDto;
import com.boot.eumbank.foreign.repo.ForeignHistoryRepo;
import com.boot.eumbank.foreign.service.ForeignExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/foreign/exchange")
@RequiredArgsConstructor
@Slf4j
public class ForeignExchangeController {

    private final ForeignExchangeService exchangeService;
    private final ForeignHistoryRepo historyRepo;

    /* ----------------------- 유틸: 입력 정규화 ----------------------- */

    /** "JPY(100)" → "JPY", " jpy  " → "JPY" */
    private static String toIso3(String cur) {
        if (cur == null) return null;
        String s = cur.trim().toUpperCase(Locale.ROOT);
        int i = s.indexOf('(');
        return (i > 0) ? s.substring(0, i) : s;
    }

    /** null-세이프 트림 */
    private static String ntrim(String s) {
        return s == null ? null : s.trim();
    }

    /** 숫자/하이픈 섞인 계좌표기 통일 (앞뒤 공백 제거만 하고, 포맷 검증은 서비스에서) */
    private static String normalizeAccount(String acc) {
        return ntrim(acc);
    }

    /** 요청 DTO를 **제자리에서** 정규화(필드 setter 있는 DTO 가정) */
    private static void normalizeReq(FxExchangeReqDto req) {
        // 통화코드 ISO3
        req.setFromCurUnit(toIso3(req.getFromCurUnit()));
        req.setToCurUnit(toIso3(req.getToCurUnit()));

        // 타입/메모/계좌번호 정리
        if (req.getTransactionType() != null) {
            req.setTransactionType(req.getTransactionType().trim().toUpperCase(Locale.ROOT));
        }
        req.setFromAccountNo(normalizeAccount(req.getFromAccountNo()));
        req.setToAccountNo(normalizeAccount(req.getToAccountNo())); // ★ 추가
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
            // 입력 1차 방어 (금액/통화 존재)
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
            // ★ 입금 계좌 필수 (BUY는 외화계좌, SELL은 원화계좌)
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
            @RequestParam(name = "customerNo", required = false) Integer customerNo
    ) {
        Integer key = (cNo != null) ? cNo : customerNo;

        if (key == null) {
            log.info("[FX] history req without cNo -> []");
            return ResponseEntity.ok(List.of());
        }

        var list = historyRepo.findByCNoOrderByFhOrderedAtDesc(key);
        log.info("[FX] history req cNo={} -> {} rows", key, list.size());

        var body = list.stream().map(h -> Map.of(
                "exId",      h.getFhExId(),
                "eventType", h.getFhEventType(),   // SELL/BUY/...
                "status",    h.getFhStatus(),      // REQUESTED/COMPLETED/...
                "curCode",   h.getFhFxCurCode(),
                "fxAmt",     h.getFhFxAmtFc(),
                "amtKrw",    h.getFhAmtKrw(),
                "rate",      h.getFhFxRateApplied(),
                "orderedAt", h.getFhOrderedAt()
        )).toList();

        return ResponseEntity.ok(body);
    }
}
