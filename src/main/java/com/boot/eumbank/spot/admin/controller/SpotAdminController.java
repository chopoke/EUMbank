package com.boot.eumbank.spot.admin.controller;

import com.boot.eumbank.spot.admin.dto.SpotAdminStatisticsDTO;
import com.boot.eumbank.spot.admin.dto.SpotUserHoldingsDTO;
import com.boot.eumbank.spot.admin.service.SpotAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 현물 관리자 컨트롤러
 * 관리자 대시보드에서 사용할 현물 통계 API 제공
 * 
 * 기존 AdminDashboardController와 분리하여 병합 시 충돌 최소화
 */
@RestController
@RequestMapping("/api/admin/spot")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SpotAdminController {
    
    private final SpotAdminService spotAdminService;
    
    /**
     * 현물 통계 데이터 조회
     * GET /api/admin/spot/statistics
     * 
     * @return 현물 관련 전체 통계
     */
    @GetMapping("/statistics")
    public ResponseEntity<SpotAdminStatisticsDTO> getSpotStatistics() {
        SpotAdminStatisticsDTO statistics = spotAdminService.getSpotStatistics();
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/users")
    public ResponseEntity<List<SpotUserHoldingsDTO>> getUserHoldings() {
        return ResponseEntity.ok(spotAdminService.getUserHoldings());
    }
}

