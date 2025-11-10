package com.boot.eumbank.admin.controller;

import com.boot.eumbank.admin.dto.CustomerAdminRow;
import com.boot.eumbank.admin.dto.CustomerAdminStats;
import com.boot.eumbank.admin.service.CustomerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class CustomerAdminController {

    private final CustomerAdminService service;

    @GetMapping
    public Page<CustomerAdminRow> list(
            @RequestParam(defaultValue = "") String keyword,      // ← 화면과 이름 통일
            @RequestParam(defaultValue = "All") String status,
            @RequestParam(required = false) String verification,  // VERIFIED/PENDING/REJECTED
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(keyword, status, verification, page, size);
    }

    @GetMapping("/stats")
    public CustomerAdminStats stats() {
        return service.stats();
    }

    @GetMapping("/{id}")
    public CustomerAdminRow detail(@PathVariable Integer id) {
        return service.detail(id);
    }

    @PatchMapping("/{id}/status")
    public void toggleStatus(@PathVariable Integer id) {
        service.toggleStatus(id);
    }

    @PatchMapping("/{id}/verify")
    public void verify(@PathVariable Integer id,
                       @RequestParam String action) { // approve|verify|reject|pending
        service.setVerification(id, action);
    }
}
