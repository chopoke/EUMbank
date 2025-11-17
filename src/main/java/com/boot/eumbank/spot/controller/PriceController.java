package com.boot.eumbank.spot.controller;

/**
 * 현물 시세 조회 컨트롤러
 * - 시세 조회 기능: Spring Boot + JPA + QueryDSL
 * - 시세 전용 테이블(PRICE_TBL) 분리 관리
 * - 가상시뮬레이션으로 실시간 변동률 표시
 * - API: GET /api/prices/latest/{metalCode}, /api/prices/recent/{metalCode}
 */

import com.boot.eumbank.spot.dto.PriceDto;
import com.boot.eumbank.spot.model.Price;
import com.boot.eumbank.spot.service.price.PriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
@Slf4j
public class PriceController {
    
    private final PriceService priceService;
    
    /**
     * 최신 시세 조회
     * @param metalCode 금속 코드(AU/AG)
     * @return 최신 시세 DTO
     */
    @GetMapping("/latest/{metalCode}")
    public ResponseEntity<PriceDto> getLatestPrice(@PathVariable String metalCode) {
        try {
            log.info("가격 조회 요청: metalCode={}", metalCode);
            
            // 데이터가 없으면 초기화
            if (!priceService.hasPriceData(metalCode)) {
                log.info("가격 데이터가 없어 초기화 시작: {}", metalCode);
                priceService.initializePrices();
            }
            
            Price price = priceService.getLatestPrice(metalCode);
            log.info("가격 조회 성공: {}", price);
            return ResponseEntity.ok(priceService.toPriceDto(price));
        } catch (Exception e) {
            log.error("시세 조회 실패: metalCode={}, error={}", metalCode, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 모든 금속의 최신 시세 조회
     * @return 금속코드→시세 DTO 맵
     */
    @GetMapping("/latest")
    public ResponseEntity<Map<String, PriceDto>> getAllLatestPrices() {
        try {
            Map<String, Price> prices = priceService.getAllLatestPrices();
            return ResponseEntity.ok(priceService.toPriceDtoMap(prices));
        } catch (Exception e) {
            log.error("전체 시세 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    /**
     * 최근 시세 조회 (차트용)
     * @param metalCode 금속 코드(AU/AG)
     * @param hours 최근 시간 범위(시간)
     * @return 최근 시세 목록
     */
    @GetMapping("/recent/{metalCode}")
    public ResponseEntity<List<PriceDto>> getRecentPrices(
            @PathVariable String metalCode,
            @RequestParam(defaultValue = "24") int hours) {
        try {
            List<Price> prices = priceService.getRecentPrices(metalCode, hours);
            return ResponseEntity.ok(priceService.toPriceDtos(prices));
        } catch (Exception e) {
            log.error("최근 시세 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
