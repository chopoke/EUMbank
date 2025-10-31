package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import com.boot.eumbank.foreign.service.FxOpenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/foreign/open")
@RequiredArgsConstructor
public class FxOpenController {

    private final FxOpenService service;

    /** 외화 입출금 계좌 개설 (토큰의 고객번호 사용) */
    @PostMapping
    public ResponseEntity<FxOpenRespDto> open(@AuthenticationPrincipal Customer me,
                                              @RequestBody FxOpenReqDto req) {
        return ResponseEntity.ok(service.openFxAccount(me.getCustomerNo(), req));
    }

    /** 프리뷰 계좌번호 발급 (저장 X) */
    @GetMapping("/preview")
    public ResponseEntity<Map<String, String>> preview(@RequestParam String currency) {
        String no = service.previewAccountNo(currency);
        return ResponseEntity.ok(Map.of("previewAccountNo", no)); // ★ 키 통일
    }
}
