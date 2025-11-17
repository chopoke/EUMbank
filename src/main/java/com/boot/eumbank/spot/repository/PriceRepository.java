package com.boot.eumbank.spot.repository;

/**
 * 이 인터페이스는 시세(Price) 데이터 접근을 위한 리포지토리입니다.
 * 목적
 *  - 금/은 시세 엔티티 CRUD 및 커스텀 조회
 * 사용
 *  - Spring Data JPA를 통해 구현체가 자동 생성됩니다.
 */

import com.boot.eumbank.spot.model.Price;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;

@Repository
public interface PriceRepository extends JpaRepository<Price, Integer> {

    // === 모든 메서드를 @Query로 명시적 정의 ===
    
    // 기본 조회 메서드들
    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :pMetalCode")
    List<Price> findByPMetalCode(@Param("pMetalCode") String pMetalCode);
    
    @Query("SELECT p FROM Price p WHERE p.pBasePrice = :pBasePrice")
    List<Price> findByPBasePrice(@Param("pBasePrice") BigDecimal pBasePrice);
    
    @Query("SELECT p FROM Price p WHERE p.pBuyPrice = :pBuyPrice")
    List<Price> findByPBuyPrice(@Param("pBuyPrice") BigDecimal pBuyPrice);
    
    @Query("SELECT p FROM Price p WHERE p.pSellPrice = :pSellPrice")
    List<Price> findByPSellPrice(@Param("pSellPrice") BigDecimal pSellPrice);
    
    @Query("SELECT p FROM Price p WHERE p.pFluctuationRate = :pFluctuationRate")
    List<Price> findByPFluctuationRate(@Param("pFluctuationRate") BigDecimal pFluctuationRate);

    // 정렬 조회
    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :pMetalCode ORDER BY p.pCreatedAt DESC")
    List<Price> findByPMetalCodeOrderByPCreatedAtDesc(@Param("pMetalCode") String pMetalCode);
    
    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :pMetalCode ORDER BY p.pCreatedAt DESC")
    List<Price> findTopByPMetalCodeOrderByPCreatedAtDesc(@Param("pMetalCode") String pMetalCode, Pageable pageable);

    // 날짜 범위 조회
    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt BETWEEN :startDate AND :endDate ORDER BY p.pCreatedAt ASC")
    List<Price> findByPMetalCodeAndPCreatedAtBetweenOrderByPCreatedAtAsc(@Param("pMetalCode") String pMetalCode, 
                                                                         @Param("startDate") LocalDateTime startDate, 
                                                                         @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT p FROM Price p WHERE p.pCreatedAt > :startDate ORDER BY p.pCreatedAt ASC")
    List<Price> findByPCreatedAtAfterOrderByPCreatedAtAsc(@Param("startDate") LocalDateTime startDate);

    // 금액/변동률 범위 조회
    @Query("SELECT p FROM Price p WHERE p.pBasePrice BETWEEN :pMinPrice AND :pMaxPrice")
    List<Price> findByPBasePriceBetween(@Param("pMinPrice") BigDecimal pMinPrice, @Param("pMaxPrice") BigDecimal pMaxPrice);
    
    @Query("SELECT p FROM Price p WHERE p.pFluctuationRate > :pMinFluctuation ORDER BY p.pFluctuationRate DESC")
    List<Price> findByPFluctuationRateGreaterThanOrderByPFluctuationRateDesc(@Param("pMinFluctuation") BigDecimal pMinFluctuation);
    
    @Query("SELECT p FROM Price p WHERE p.pFluctuationRate < :pMaxFluctuation ORDER BY p.pFluctuationRate ASC")
    List<Price> findByPFluctuationRateLessThanOrderByPFluctuationRateAsc(@Param("pMaxFluctuation") BigDecimal pMaxFluctuation);

    // 통계 쿼리
    @Query("SELECT AVG(p.pBasePrice) FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt >= :startDate")
    Double getAveragePriceByMetalCode(@Param("pMetalCode") String pMetalCode, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT MAX(p.pBasePrice) FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt >= :startDate")
    Double getMaxPriceByMetalCode(@Param("pMetalCode") String pMetalCode, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT MIN(p.pBasePrice) FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt >= :startDate")
    Double getMinPriceByMetalCode(@Param("pMetalCode") String pMetalCode, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT AVG(p.pFluctuationRate) FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt >= :startDate")
    Double getAverageFluctuationRate(@Param("pMetalCode") String pMetalCode, @Param("startDate") LocalDateTime startDate);

    // 최신 시세를 정렬로 가져오고 상위 1건은 Pageable로 제어
    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :metalCode ORDER BY p.pCreatedAt DESC")
    List<Price> findLatestByMetalCode(@Param("metalCode") String metalCode, Pageable pageable);

    @Query("SELECT p FROM Price p WHERE p.pMetalCode = :pMetalCode AND p.pCreatedAt BETWEEN :startDate AND :endDate ORDER BY p.pCreatedAt ASC")
    List<Price> findByMetalCodeAndDateRange(@Param("pMetalCode") String pMetalCode,
                                           @Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate);
}