package com.boot.eumbank.spot.repository;

import com.boot.eumbank.spot.model.GoldCustomer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoldCustomerRepository extends JpaRepository<GoldCustomer, Long> {

    // === 모든 메서드를 @Query로 명시적 정의 ===
    
    // 기본 조회 메서드들
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.customer.customerNo = :customerNo")
    Optional<GoldCustomer> findByCustomerCustomerNo(@Param("customerNo") Long customerNo);
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcActiveYn = :activeYn")
    List<GoldCustomer> findByGcActiveYn(@Param("activeYn") String activeYn);
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcCashBalance = :cashBalance")
    List<GoldCustomer> findByGcCashBalance(@Param("cashBalance") BigDecimal cashBalance);
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcGoldBalance = :goldBalance")
    List<GoldCustomer> findByGcGoldBalance(@Param("goldBalance") BigDecimal goldBalance);
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcSilverBalance = :silverBalance")
    List<GoldCustomer> findByGcSilverBalance(@Param("silverBalance") BigDecimal silverBalance);
    
    // 백금(PT) 제거로 인한 메서드 삭제
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcTotalInvestment = :totalInvestment")
    List<GoldCustomer> findByGcTotalInvestment(@Param("totalInvestment") BigDecimal totalInvestment);
    
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcTotalProfitLoss = :totalProfitLoss")
    List<GoldCustomer> findByGcTotalProfitLoss(@Param("totalProfitLoss") BigDecimal totalProfitLoss);

    // 존재 여부 확인
    @Query("SELECT COUNT(gc) > 0 FROM GoldCustomer gc WHERE gc.customer.customerNo = :customerNo")
    boolean existsByCustomerCustomerNo(@Param("customerNo") Long customerNo);

    // 복잡한 쿼리들
    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.customer.customerNo = :customerNo AND gc.gcActiveYn = 'Y'")
    Optional<GoldCustomer> findByCustomerNo(@Param("customerNo") Long customerNo);

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.customer.userId = :customerId AND gc.gcActiveYn = 'Y'")
    Optional<GoldCustomer> findByCustomerId(@Param("customerId") String customerId);

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcCashBalance > :minBalance ORDER BY gc.gcCashBalance DESC")
    List<GoldCustomer> findByCashBalanceGreaterThan(@Param("minBalance") BigDecimal minBalance);

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcTotalProfitLoss > 0 ORDER BY gc.gcTotalProfitLoss DESC")
    List<GoldCustomer> findProfitableCustomers();

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcTotalProfitLoss < 0 ORDER BY gc.gcTotalProfitLoss ASC")
    List<GoldCustomer> findLossCustomers();

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcGoldBalance > 0 OR gc.gcSilverBalance > 0")
    List<GoldCustomer> findCustomersWithMetalHoldings();

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcTotalInvestment BETWEEN :minInvestment AND :maxInvestment")
    List<GoldCustomer> findByInvestmentRange(@Param("minInvestment") BigDecimal minInvestment,
                                             @Param("maxInvestment") BigDecimal maxInvestment);

    @Query("SELECT gc FROM GoldCustomer gc WHERE gc.gcCashBalance < :lowBalanceThreshold")
    List<GoldCustomer> findCustomersWithLowCashBalance(@Param("lowBalanceThreshold") BigDecimal lowBalanceThreshold);
}