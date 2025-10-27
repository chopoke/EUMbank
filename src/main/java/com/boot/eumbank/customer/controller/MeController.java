package com.boot.eumbank.customer.controller;

import com.boot.eumbank.customer.dto.MeDto;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MeController {

    @GetMapping("/api/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Customer p) {
        if (p == null) return ResponseEntity.status(401).body("unauthorized");
        return ResponseEntity.ok(new MeDto(p.getUserId()));
    }
}
