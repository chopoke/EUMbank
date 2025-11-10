package com.boot.eumbank.spot.repository;

import com.boot.eumbank.spot.model.GoldProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoldProductRepository extends JpaRepository<GoldProduct, Long> {

    // === 모든 메서드를 @Query로 명시적 정의 ===
    
    // 기본 조회 메서드들
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpId = :gpId")
    Optional<GoldProduct> findByGpId(@Param("gpId") String gpId);
    
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpActiveYn = :activeYn")
    List<GoldProduct> findByGpActiveYn(@Param("activeYn") String activeYn);
    
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpMetalCode = :metalCode")
    List<GoldProduct> findByGpMetalCode(@Param("metalCode") String metalCode);
    
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpWeightG = :weight")
    List<GoldProduct> findByGpWeightG(@Param("weight") BigDecimal weight);
    
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpPurity = :purity")
    List<GoldProduct> findByGpPurity(@Param("purity") BigDecimal purity);

    // 복잡한 쿼리들
    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpActiveYn = 'Y' ORDER BY gp.gpMetalCode, gp.gpWeightG")
    List<GoldProduct> findAllActive();

    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpMetalCode = :metalCode AND gp.gpActiveYn = 'Y'")
    List<GoldProduct> findByMetalCodeAndActive(@Param("metalCode") String metalCode);

    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpMetalCode = :metalCode AND gp.gpWeightG = :weight")
    List<GoldProduct> findByMetalCodeAndWeight(@Param("metalCode") String metalCode,
                                               @Param("weight") BigDecimal weight);

    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpPurity >= :minPurity AND gp.gpPurity <= :maxPurity")
    List<GoldProduct> findByPurityRange(@Param("minPurity") BigDecimal minPurity,
                                        @Param("maxPurity") BigDecimal maxPurity);

    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpPremiumPerG BETWEEN :minPremium AND :maxPremium")
    List<GoldProduct> findByPremiumRange(@Param("minPremium") BigDecimal minPremium,
                                         @Param("maxPremium") BigDecimal maxPremium);

    @Query("SELECT gp FROM GoldProduct gp WHERE gp.gpName LIKE %:name%")
    List<GoldProduct> findByNameContaining(@Param("name") String name);
}