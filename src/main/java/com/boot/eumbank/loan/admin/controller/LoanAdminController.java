package com.boot.eumbank.loan.admin.controller;

import com.boot.eumbank.loan.admin.dto.*;
import com.boot.eumbank.loan.admin.service.LoanAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/loan/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LoanAdminController {

    private final LoanAdminService service;

    // 대출신청목록
    @GetMapping("/applications")
    public ResponseEntity<Page<LoanApplySummaryDTO>> list(
            LoanApplySearchDTO cond) {
        return ResponseEntity.ok(service.findApplications(cond));
    }

    // 단건 상세 조회
    @GetMapping("/applications/{laId}")
    public ResponseEntity<LoanApplyDetailDTO> detail(@PathVariable String laId) {
        return ResponseEntity.ok(service.getDetail(laId));
    }

    // 심사 시작 (submitted->under_review)
    @PostMapping("/applications/{laId}/review/start")
    public ResponseEntity<Map<String, String>> startReview(@PathVariable String laId) {
        service.startReview(laId);
        return ResponseEntity.ok(Map.of("status", "UNDER_REVIEW"));
    }

    // 승인(under_review->approved -> fund)
    @PostMapping("/applications/{laId}/approve")
    public ResponseEntity<LoanApproveResultDTO> approve(
            @PathVariable String laId,
            @RequestBody LoanApproveComDTO cmd) {
        return ResponseEntity.ok(service.approve(laId, cmd));
    }

    // 반려 (submitted -> reject)
    @PostMapping("/applications/{laId}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable String laId,
            @RequestBody LoanRejectComDTO cmd) {
        service.reject(laId, cmd);
        return ResponseEntity.ok().build();
    }


}
