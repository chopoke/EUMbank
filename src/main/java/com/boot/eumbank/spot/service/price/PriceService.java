package com.boot.eumbank.spot.service.price;

/**
 * 이 클래스는 현물 시세 비즈니스 로직을 담당하는 서비스입니다.
 * 목적
 *  - 금/은 시세 조회 및 가공
 *  - 기간별 데이터 제공
 * 사용
 *  - 컨트롤러에서 호출하여 DTO 혹은 엔티티를 반환합니다.
 */

import com.boot.eumbank.spot.dto.PriceDto;
import com.boot.eumbank.spot.model.Price;
import com.boot.eumbank.spot.repository.PriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceService {

    private final PriceRepository priceRepository;
    private final Random random = new Random();

    private static final Map<String, BigDecimal> BASE_PRICES = new HashMap<>();
    static {
        BASE_PRICES.put("AU", new BigDecimal("808000.00"));
        BASE_PRICES.put("PT", new BigDecimal("318000.00"));
        BASE_PRICES.put("AG", new BigDecimal("10860.00"));
    }

    private static final BigDecimal BANK_FEE_RATE = new BigDecimal("0.01");

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void updateVirtualPrices() {
        log.info("가상 시세 업데이트 시작");

        for (Map.Entry<String, BigDecimal> entry : BASE_PRICES.entrySet()) {
            String metalCode = entry.getKey();
            BigDecimal basePrice = entry.getValue();

            BigDecimal fluctuationRate = generateFluctuationRate();
            BigDecimal newBasePrice = basePrice.multiply(BigDecimal.ONE.add(fluctuationRate.divide(new BigDecimal("100"))));

            BigDecimal buyPrice = calculateBuyPrice(newBasePrice);
            BigDecimal sellPrice = calculateSellPrice(newBasePrice);

            Price price = Price.builder()
                    .pMetalCode(metalCode)
                    .pBasePrice(newBasePrice)
                    .pBuyPrice(buyPrice)
                    .pSellPrice(sellPrice)
                    .pFluctuationRate(fluctuationRate)
                    .pCreatedAt(LocalDateTime.now())
                    .build();

            priceRepository.save(price);
            log.info("{} 시세 업데이트: 기준가={}, 매수가={}, 매도가={}, 변동률={}%"
                    , metalCode, newBasePrice, buyPrice, sellPrice, fluctuationRate);
        }
    }

    @Transactional
    public void initializePrices() {
        log.info("=== 초기 시세 데이터 생성 시작 ===");
        
        try {
            // 먼저 기존 데이터 확인
            long existingCount = priceRepository.count();
            log.info("기존 시세 데이터 개수: {}", existingCount);
            
            for (Map.Entry<String, BigDecimal> entry : BASE_PRICES.entrySet()) {
                String metalCode = entry.getKey();
                BigDecimal basePrice = entry.getValue();
                
                log.info("{} 시세 초기화 시작: 기준가={}", metalCode, basePrice);

                BigDecimal fluctuationRate = BigDecimal.ZERO;
                BigDecimal buyPrice = calculateBuyPrice(basePrice);
                BigDecimal sellPrice = calculateSellPrice(basePrice);

                Price price = Price.builder()
                        .pMetalCode(metalCode)
                        .pBasePrice(basePrice)
                        .pBuyPrice(buyPrice)
                        .pSellPrice(sellPrice)
                        .pFluctuationRate(fluctuationRate)
                        .pCreatedAt(LocalDateTime.now())
                        .build();

                log.info("{} 시세 엔티티 생성 완료: 기준가={}, 매수가={}, 매도가={}", 
                    metalCode, basePrice, buyPrice, sellPrice);
                
                Price savedPrice = priceRepository.save(price);
                log.info("{} 시세 데이터 저장 완료: ID={}", metalCode, savedPrice.getPNo());
            }
            
            long finalCount = priceRepository.count();
            log.info("=== 초기 시세 데이터 생성 완료 ===");
            log.info("최종 시세 데이터 개수: {}", finalCount);
            
        } catch (Exception e) {
            log.error("=== 초기 시세 데이터 생성 실패 ===");
            log.error("에러 메시지: {}", e.getMessage());
            log.error("에러 스택트레이스:", e);
            throw e;
        }
    }
    // 변동률/매수·매도가/기준가 계산 함수들:
    
    private BigDecimal generateFluctuationRate() {
        double randomValue = random.nextDouble() - 0.5;
        return new BigDecimal(randomValue).setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateBuyPrice(BigDecimal basePrice) {
        return basePrice.multiply(BigDecimal.ONE.add(BANK_FEE_RATE));
    }

    private BigDecimal calculateSellPrice(BigDecimal basePrice) {
        return basePrice.multiply(BigDecimal.ONE.subtract(BANK_FEE_RATE));
    }

    public boolean hasPriceData(String metalCode) {
        return !priceRepository.findLatestByMetalCode(metalCode, org.springframework.data.domain.PageRequest.of(0,1)).isEmpty();
    }

    public Price getLatestPrice(String metalCode) {
        try {
            log.info("=== 최신 시세 조회 시작 ===");
            log.info("조회할 금속코드: {}", metalCode);
            log.info("사용할 테이블: PRICE_TBL");
            
            // 먼저 테이블 존재 여부 확인
            try {
                long totalCount = priceRepository.count();
                log.info("PRICE_TBL 테이블 총 레코드 수: {}", totalCount);
            } catch (Exception e) {
                log.error("PRICE_TBL 테이블 접근 실패: {}", e.getMessage());
                throw new RuntimeException("PRICE_TBL 테이블에 접근할 수 없습니다: " + e.getMessage());
            }
            
            // Pageable 방식으로 시세 조회
            log.info("Pageable 방식으로 시세 조회 시작");
            List<Price> list = priceRepository.findLatestByMetalCode(metalCode, org.springframework.data.domain.PageRequest.of(0,1));
            log.info("시세 조회 결과: metalCode={}, count={}", metalCode, list.size());
            
            if (list.isEmpty()) {
                log.error("시세 정보를 찾을 수 없습니다: metalCode={}", metalCode);
                log.info("시세 데이터 초기화를 시도합니다");
                initializePrices();
                
                // 초기화 후 다시 조회
                list = priceRepository.findLatestByMetalCode(metalCode, org.springframework.data.domain.PageRequest.of(0,1));
                log.info("초기화 후 재조회 결과: metalCode={}, count={}", metalCode, list.size());
                
                if (list.isEmpty()) {
                    throw new RuntimeException("시세 정보를 찾을 수 없습니다: " + metalCode);
                }
            }
            
            Price result = list.get(0);
            log.info("=== 최신 시세 조회 완료 ===");
            log.info("금속코드: {}, 기준가: {}, 매수가: {}, 매도가: {}", 
                metalCode, result.getPBasePrice(), result.getPBuyPrice(), result.getPSellPrice());
            return result;
        } catch (Exception e) {
            log.error("=== 최신 시세 조회 실패 ===");
            log.error("금속코드: {}", metalCode);
            log.error("에러 메시지: {}", e.getMessage());
            log.error("에러 스택트레이스:", e);
            throw new RuntimeException("시세 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    public PriceDto getLatestPriceDto(String metalCode) {
        return toPriceDto(getLatestPrice(metalCode));
    }

    public List<Price> getPriceHistory(String metalCode, LocalDateTime startDate, LocalDateTime endDate) {
        return priceRepository.findByMetalCodeAndDateRange(metalCode, startDate, endDate);
    }

    public List<PriceDto> getPriceHistoryDto(String metalCode, LocalDateTime startDate, LocalDateTime endDate) {
        return toPriceDtos(getPriceHistory(metalCode, startDate, endDate));
    }

    public List<Price> getRecentPrices(String metalCode, int hours) {
        LocalDateTime startDate = LocalDateTime.now().minusHours(hours);
        return priceRepository.findByMetalCodeAndDateRange(metalCode, startDate, LocalDateTime.now());
    }

    public List<PriceDto> getRecentPricesDto(String metalCode, int hours) {
        return toPriceDtos(getRecentPrices(metalCode, hours));
    }

    public Map<String, Price> getAllLatestPrices() {
        Map<String, Price> latestPrices = new HashMap<>();
        for (String metalCode : BASE_PRICES.keySet()) {
            latestPrices.put(metalCode, getLatestPrice(metalCode));
        }
        return latestPrices;
    }

    public Map<String, PriceDto> getAllLatestPricesDto() {
        return toPriceDtoMap(getAllLatestPrices());
    }

    // QueryDSL 변환 메서드들
    public PriceDto toPriceDto(Price price) {
        if (price == null) return null;
        
        PriceDto dto = new PriceDto();
        dto.metalCode = price.getPMetalCode();
        dto.basePrice = price.getPBasePrice();
        dto.buyPrice = price.getPBuyPrice();
        dto.sellPrice = price.getPSellPrice();
        dto.fluctuationRate = price.getPFluctuationRate();
        dto.createdAt = price.getPCreatedAt();
        return dto;
    }

    public List<PriceDto> toPriceDtos(List<Price> prices) {
        return prices.stream()
                .map(this::toPriceDto)
                .collect(Collectors.toList());
    }

    public Map<String, PriceDto> toPriceDtoMap(Map<String, Price> priceMap) {
        return priceMap.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    entry -> toPriceDto(entry.getValue())
                ));
    }
}
