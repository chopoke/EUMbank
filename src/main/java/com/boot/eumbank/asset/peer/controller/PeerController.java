package com.boot.eumbank.asset.peer.controller;

import com.boot.eumbank.asset.peer.dto.PeerCompareResponse;
import com.boot.eumbank.asset.peer.dto.PeerProfileDto;
import com.boot.eumbank.asset.peer.service.PeerService;
import com.boot.eumbank.customer.entity.Customer;
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
        //var p = peerService.getMyProfile(customer.getCustomerNo());
        //if (p == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(null);
        // 필요하다면 PeerCompareResponse를 돌려도 OK
    }

    @PostMapping("/profile")
    public ResponseEntity<PeerCompareResponse> saveProfile(@AuthenticationPrincipal Customer customer, @RequestBody PeerProfileDto dto) {
        //var res = peerService.saveProfileAndCompare(customer.getCustomerNo(), dto);
        return ResponseEntity.ok(null);
    }
}
