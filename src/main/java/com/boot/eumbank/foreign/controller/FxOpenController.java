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

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me() {
        return ResponseEntity.ok(service.getNo());
    }
}