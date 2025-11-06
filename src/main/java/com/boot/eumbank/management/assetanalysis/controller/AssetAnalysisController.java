package com.boot.eumbank.management.assetanalysis.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.management.assetanalysis.dto.AssetAnalysisResponse;
import com.boot.eumbank.management.assetanalysis.dto.AssetGoalDto;
import com.boot.eumbank.management.assetanalysis.dto.AssetGoalRequest;
import com.boot.eumbank.management.assetanalysis.service.AssetAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 자산 분석 컨트롤러
 * AssetAnalysis.js와 연동하는 REST API 제공
 */
@Slf4j
@RestController
@RequestMapping("/api/asset")
@RequiredArgsConstructor
public class AssetAnalysisController {

    private final AssetAnalysisService assetAnalysisService;

    /**
     * 자산 분석 전체 데이터 조회
     * GET /api/asset/analysis?period=WEEKLY&count=4
     * 
     * @param customer 현재 로그인한 고객 정보
     * @param period 비교 기간 (DAILY, WEEKLY, MONTHLY) - 기본값: WEEKLY
     * @param count 비교 개수 (일간: 1-10, 주간: 1-5, 월간: 1-6) - 기본값: period별 기본값
     * @return AssetAnalysisResponse 자산 분석 전체 응답
     */
    @GetMapping("/analysis")
    public ResponseEntity<?> getAssetAnalysis(
            @AuthenticationPrincipal Customer customer,
            @RequestParam(required = false, defaultValue = "WEEKLY") String period,
            @RequestParam(required = false) Integer count) {
        try {
            if (customer == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }

            log.info("자산 분석 조회: customerNo={}, userId={}, period={}, count={}", 
                    customer.getCustomerNo(), customer.getUserId(), period, count);

            AssetAnalysisResponse response = assetAnalysisService.getAssetAnalysis(
                    customer.getCustomerNo(), period, count);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("자산 분석 조회 실패: customerNo={}", 
                    customer != null ? customer.getCustomerNo() : "null", e);
            return ResponseEntity.status(500).body("자산 분석 조회 중 오류가 발생했습니다.");
        }
    }

    /**
     * 자산 목표 설정 또는 수정
     * POST /api/asset/goal
     * 
     * @param customer 현재 로그인한 고객 정보
     * @param request 목표 설정 요청
     * @return 설정된 목표 정보
     */
    @PostMapping("/goal")
    public ResponseEntity<?> setGoal(
            @AuthenticationPrincipal Customer customer,
            @Valid @RequestBody AssetGoalRequest request) {
        try {
            if (customer == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }

            log.info("자산 목표 설정 요청: customerNo={}, userId={}, targetAmount={}", 
                    customer.getCustomerNo(), customer.getUserId(), request.getTargetAmount());

            AssetGoalDto response = assetAnalysisService.setGoal(
                    customer.getCustomerNo(), request);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("잘못된 요청: customerNo={}, error={}", 
                    customer != null ? customer.getCustomerNo() : "null", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("자산 목표 설정 실패: customerNo={}", 
                    customer != null ? customer.getCustomerNo() : "null", e);
            return ResponseEntity.status(500).body("자산 목표 설정 중 오류가 발생했습니다.");
        }
    }
}


