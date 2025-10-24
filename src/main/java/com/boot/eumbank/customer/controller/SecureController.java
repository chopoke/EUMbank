package com.boot.eumbank.customer.controller;

import com.boot.eumbank.customer.dto.AgreeRequest;
import com.boot.eumbank.customer.service.SocialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/secure")
@RequiredArgsConstructor
public class SecureController {

    private final SocialService socialService;

    @PostMapping("/agree")
    public ResponseEntity<?> agree(@Valid @RequestBody AgreeRequest req) {
        socialService.agree(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agree/check")
    public ResponseEntity<AgreeRequest> checkAgree() {
        AgreeRequest agree =  socialService.getAgree();

        return ResponseEntity.ok(agree);
    }
}
