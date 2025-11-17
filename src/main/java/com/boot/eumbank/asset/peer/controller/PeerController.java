package com.boot.eumbank.asset.peer.controller;

import com.boot.eumbank.asset.peer.dto.PeerCompareResponse;
import com.boot.eumbank.asset.peer.dto.PeerProfileDto;
import com.boot.eumbank.asset.peer.service.PeerService;
import com.boot.eumbank.customer.entity.Customer;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/asset/peer")
@RequiredArgsConstructor
public class PeerController {

    private final PeerService peerService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal Customer customer) {
        PeerProfileDto dto = peerService.getMyProfile(customer.getCustomerNo());
        return (dto == null) ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    @PostMapping("/profile")
    public ResponseEntity<PeerCompareResponse> saveProfile(@AuthenticationPrincipal Customer customer, @Valid @RequestBody PeerProfileDto dto) {
        PeerCompareResponse res = peerService.saveProfileAndCompare(customer.getCustomerNo(), dto);
        return ResponseEntity.ok(res);
    }
}
