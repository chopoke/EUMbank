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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foreign/exchange")
@RequiredArgsConstructor
@Slf4j
public class ForeignExchangeController {

    private final ForeignExchangeService exchangeService;
    private final ForeignHistoryRepo historyRepo;

    /** 환전 계산 (미리보기) */
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateExchange(@Valid @RequestBody FxExchangeReqDto reqDto) {
        log.info("[FX] calculate req: {}", reqDto);
        try {
            FxExchangeCalcRespDto result = exchangeService.calculateExchange(reqDto);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("[FX] calculate fail: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("[FX] calculate unexpected error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "서버 오류가 발생했습니다."));
        }
    }

    /** 환전 신청 (거래 실행) */
    @PostMapping
    public ResponseEntity<?> submitExchange(@Valid @RequestBody FxExchangeReqDto reqDto) {
        log.info("[FX] submit req: {}", reqDto);
        try {
            FxExchangeRespDto result = exchangeService.exchange(reqDto);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("[FX] submit fail: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("[FX] submit unexpected error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "서버 오류가 발생했습니다."));
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
