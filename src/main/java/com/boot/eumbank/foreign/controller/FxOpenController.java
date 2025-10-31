package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import com.boot.eumbank.foreign.service.FxOpenService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/foreign/open")
@RequiredArgsConstructor
public class FxOpenController {

    private final FxOpenService service;
    private final CustomerRepo customerRepo; // ✅ 추가

    @PostMapping
    public ResponseEntity<FxOpenRespDto> open(@RequestBody FxOpenReqDto req) {
        return ResponseEntity.ok(service.openUsdAccount(req));
    }

    /** 프리뷰 계좌번호 발급 (저장 X) */
    @GetMapping("/preview")
    public ResponseEntity<Map<String, String>> preview(@RequestParam String currency) {
        String no = service.previewAccountNo(currency);
        return ResponseEntity.ok(Map.of("accountNo", no));
    }

    // ❌ (삭제) @GetMapping("/me") — 단일 출처는 /api/foreign/me

    /** 영문 이름 최초 1회 등록 */
    @PatchMapping("/name-en")
    @Transactional
    public ResponseEntity<?> setEnglishName(Authentication auth, @RequestBody NameEnReq req) {
        String raw = (req == null ? null : req.getEnglishName());
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "englishName is required");
        }
        String name = raw.trim().toUpperCase(Locale.ROOT);
        if (!name.matches("[A-Z ]{2,40}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A–Z and space only (2–40)");
        }

        String userId = resolveUserId(auth);
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "customer not found"));

        // 이미 등록되어 있으면 409로 알림 (프런트는 성공처럼 처리하고 잠그면 됨)
        if (c.getCNameEn() != null && !c.getCNameEn().isBlank()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("ok", true, "message", "already set", "englishName", c.getCNameEn()));
        }

        c.setCNameEn(name);
        customerRepo.save(c);
        return ResponseEntity.ok(Map.of("ok", true, "englishName", name));
    }

    private String resolveUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof Customer cu) return cu.getUserId();
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
    }

    @Data
    public static class NameEnReq { private String englishName; } // ✅ 프런트와 동일 키
}
