package com.boot.eumbank.asset.assetreport.controller;

import com.boot.eumbank.asset.assetreport.dto.AssetReportResponse;
import com.boot.eumbank.asset.assetreport.dto.DailyTransactionResponse;
import com.boot.eumbank.asset.assetreport.service.AssetReportService;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * 자산 리포트 컨트롤러
 * AssetReport.js와 연동하는 REST API 제공
 * 
 * @author 임형욱
 */
@Slf4j
@RestController
@RequestMapping("/api/asset/report")
@RequiredArgsConstructor
public class AssetReportController {

    private final AssetReportService assetReportService;

    /**
     * 월별 리포트 조회
     * GET /api/asset/report?year=2025&month=10
     * 
     * @param customer 현재 로그인한 고객 정보
     * @param year 조회할 연도
     * @param month 조회할 월 (1-12)
     * @return 월별 리포트 응답
     */
    @GetMapping
    public ResponseEntity<?> getMonthlyReport(
            @AuthenticationPrincipal Customer customer,
            @RequestParam int year,
            @RequestParam int month
    ) {
        try {
            if (customer == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }

            // 월 유효성 검증
            if (month < 1 || month > 12) {
                return ResponseEntity.badRequest().body("월은 1-12 사이의 값이어야 합니다.");
            }

            log.info("월별 리포트 조회: customerNo={}, userId={}, year={}, month={}", 
                    customer.getCustomerNo(), customer.getUserId(), year, month);

            AssetReportResponse response = assetReportService.getMonthlyReport(
                    customer.getCustomerNo(), year, month);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("월별 리포트 조회 실패: customerNo={}", 
                    customer != null ? customer.getCustomerNo() : "null", e);
            return ResponseEntity.status(500).body("월별 리포트 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 일별 상세 거래 내역 조회
     * GET /api/asset/report/daily?date=2025-10-15
     * 
     * @param customer 현재 로그인한 고객 정보
     * @param date 조회할 날짜 (YYYY-MM-DD)
     * @return 일별 거래 상세 응답
     */
    @GetMapping("/daily")
    public ResponseEntity<?> getDailyTransactions(
            @AuthenticationPrincipal Customer customer,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        try {
            if (customer == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }

            log.info("일별 거래 상세 조회: customerNo={}, userId={}, date={}", 
                    customer.getCustomerNo(), customer.getUserId(), date);

            DailyTransactionResponse response = assetReportService.getDailyTransactions(
                    customer.getCustomerNo(), date);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("일별 거래 상세 조회 실패: customerNo={}", 
                    customer != null ? customer.getCustomerNo() : "null", e);
            return ResponseEntity.status(500).body("일별 거래 상세 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}

