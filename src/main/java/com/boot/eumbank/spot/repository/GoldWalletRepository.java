package com.boot.eumbank.spot.repository;

import com.boot.eumbank.spot.model.GoldWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoldWalletRepository extends JpaRepository<GoldWallet, Integer> {

    // === 모든 메서드를 @Query로 명시적 정의 ===
    
    // 기본 조회 메서드들
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.customer.customerNo = :customerNo")
    List<GoldWallet> findByCustomerCustomerNo(@Param("customerNo") Long customerNo);
    
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwWalletName = :walletName")
    Optional<GoldWallet> findByGwWalletName(@Param("walletName") String walletName);
    
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwActiveYn = :activeYn")
    List<GoldWallet> findByGwActiveYn(@Param("activeYn") String activeYn);
    
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwCashBalance = :cashBalance")
    List<GoldWallet> findByGwCashBalance(@Param("cashBalance") BigDecimal cashBalance);
    
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwGoldBalance = :goldBalance")
    List<GoldWallet> findByGwGoldBalance(@Param("goldBalance") BigDecimal goldBalance);
    
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwSilverBalance = :silverBalance")
    List<GoldWallet> findByGwSilverBalance(@Param("silverBalance") BigDecimal silverBalance);

    // 복잡한 쿼리들
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.customer.customerNo = :customerNo AND gw.gwActiveYn = 'Y'")
    List<GoldWallet> findByCustomerNoAndActive(@Param("customerNo") Long customerNo);

    @Query("SELECT gw FROM GoldWallet gw WHERE gw.customer.customerNo = :customerNo AND gw.gwWalletName = :walletName")
    Optional<GoldWallet> findByCustomerNoAndWalletName(@Param("customerNo") Long customerNo, 
                                                      @Param("walletName") String walletName);

    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwCashBalance > :minBalance ORDER BY gw.gwCashBalance DESC")
    List<GoldWallet> findByCashBalanceGreaterThan(@Param("minBalance") BigDecimal minBalance);

    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwGoldBalance > 0 OR gw.gwSilverBalance > 0")
    List<GoldWallet> findWalletsWithMetalHoldings();

    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwTotalBalance BETWEEN :minBalance AND :maxBalance")
    List<GoldWallet> findByTotalBalanceRange(@Param("minBalance") BigDecimal minBalance,
                                             @Param("maxBalance") BigDecimal maxBalance);

    @Query("SELECT gw FROM GoldWallet gw WHERE gw.gwCashBalance < :lowBalanceThreshold")
    List<GoldWallet> findWalletsWithLowCashBalance(@Param("lowBalanceThreshold") BigDecimal lowBalanceThreshold);

    // 존재 여부 확인
    @Query("SELECT COUNT(gw) > 0 FROM GoldWallet gw WHERE gw.customer.customerNo = :customerNo AND gw.gwWalletName = :walletName")
    boolean existsByCustomerNoAndWalletName(@Param("customerNo") Long customerNo, 
                                           @Param("walletName") String walletName);

    // 월렛명으로 조회
    @Query("SELECT gw FROM GoldWallet gw WHERE gw.customer.customerNo = :customerNo AND gw.gwWalletName = :walletName")
    Optional<GoldWallet> findByCustomerCustomerNoAndGwWalletName(@Param("customerNo") Long customerNo, @Param("walletName") String walletName);
}
