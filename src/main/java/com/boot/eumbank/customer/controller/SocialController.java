package com.boot.eumbank.customer.controller;

import com.boot.eumbank.customer.dto.AgreeRequest;
import com.boot.eumbank.customer.dto.LinkRequest;
import com.boot.eumbank.customer.service.SocialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    @PatchMapping("/agree")
    public ResponseEntity<?> agree(@Valid @RequestBody AgreeRequest req) {
        socialService.updateAgree(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agree/check")
    public ResponseEntity<AgreeRequest> checkAgree() {
        AgreeRequest agree =  socialService.getAgree();

        return ResponseEntity.ok(agree);
    }

    @PatchMapping("/link")
    public ResponseEntity<?> link(@Valid @RequestBody LinkRequest req, HttpServletRequest request, HttpServletResponse response) {
        return socialService.linkNaverId(req, request, response);
    }

}
