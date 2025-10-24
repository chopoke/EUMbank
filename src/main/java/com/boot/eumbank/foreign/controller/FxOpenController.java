package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import com.boot.eumbank.foreign.service.FxOpenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/foreign/open")
@RequiredArgsConstructor
public class FxOpenController {

    private final FxOpenService service;

    @PostMapping
    public ResponseEntity<FxOpenRespDto> open(@RequestBody FxOpenReqDto req) {
        return ResponseEntity.ok(service.openUsdAccount(req));
    }

    // ★ 프리뷰 계좌번호 발급 (저장 X)
    @GetMapping("/preview")
    public ResponseEntity<Map<String, String>> preview(@RequestParam String currency) {
        String no = service.previewAccountNo(currency);
        return ResponseEntity.ok(Map.of("accountNo", no));
    }

    // 고객번호(+영문이름) 조회
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        return ResponseEntity.ok(service.getNo());
    }
}
