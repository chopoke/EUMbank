// src/main/java/com/boot/eumbank/admin/controller/CustomerAdminController.java
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

    /** 목록 조회 (인증 파라미터 없음) */
    @GetMapping
    public Page<CustomerAdminRow> list(
            @RequestParam(defaultValue = "")   String keyword,   // 이름/이메일 검색
            @RequestParam(defaultValue = "All") String status,   // ACTIVE/INACTIVE/BLOCKED/All
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size
    ) {
        return service.list(keyword, status, page, size);
    }

    /** 집계 */
    @GetMapping("/stats")
    public CustomerAdminStats stats() {
        return service.stats();
    }

    /** 상세 */
    @GetMapping("/{id}")
    public CustomerAdminRow detail(@PathVariable Integer id) {
        return service.detail(id);
    }

    /** 상태 토글 (ACTIVE <-> INACTIVE) */
    @PatchMapping("/{id}/status")
    public void toggleStatus(@PathVariable Integer id) {
        service.toggleStatus(id);
    }

    /** 계좌 정지 */
    @PatchMapping("/{id}/freeze")
    public void freeze(@PathVariable Integer id) {
        service.freezeCustomer(id);
    }

    /** 계좌 정지 해제 */
    @PatchMapping("/{id}/unfreeze")
    public void unfreeze(@PathVariable Integer id) {
        service.unfreezeCustomer(id);
    }
}
