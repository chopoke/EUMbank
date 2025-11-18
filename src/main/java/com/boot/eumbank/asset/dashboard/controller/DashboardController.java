package com.boot.eumbank.asset.dashboard.controller;

import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.dto.AssetTrendDto;
import com.boot.eumbank.asset.dashboard.dto.TopSavingsDto;
import com.boot.eumbank.asset.dashboard.dto.TrendMetric;
import com.boot.eumbank.asset.dashboard.service.DashboardService;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/asset/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<AssetSummaryDto> summary(@AuthenticationPrincipal Customer customer) {
        return ResponseEntity.ok(dashboardService.getDashboardSummary(customer.getCustomerNo()));
    }

    @GetMapping("/trend")
    public ResponseEntity<AssetTrendDto> trend(@AuthenticationPrincipal Customer customer, @RequestParam(defaultValue = "NET_WORTH") TrendMetric metric) {
        return ResponseEntity.ok(dashboardService.getTrend(customer.getCustomerNo(), metric));
    }

    @GetMapping("/top-savings")
    public ResponseEntity<TopSavingsDto> topSavings(@AuthenticationPrincipal Customer customer) {
        return ResponseEntity.ok(dashboardService.getTopSavings(customer.getCustomerNo()));
    }
}
