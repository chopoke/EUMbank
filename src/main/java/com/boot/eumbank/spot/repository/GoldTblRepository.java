package com.boot.eumbank.spot.repository;

/**
 * 이 인터페이스는 금/은 거래(GoldTbl) 데이터 접근을 위한 리포지토리입니다.
 * 목적
 *  - 고객별 거래내역 조회 및 저장
 * 사용
 *  - Spring Data JPA 자동 구현체를 통해 서비스에서 호출됩니다.
 */

import com.boot.eumbank.spot.model.GoldTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GoldTblRepository extends JpaRepository<GoldTbl, Integer> {

    // === 모든 메서드를 @Query로 명시적 정의 ===
    
    // 기본 조회 메서드들
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gStatus = :status")
    List<GoldTbl> findByGStatus(@Param("status") GoldTbl.TransactionStatus status);
    
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.goldProduct.gpMetalCode = :metalCode")
    List<GoldTbl> findByGoldProductGpMetalCode(@Param("metalCode") String metalCode);
    
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.customer.customerNo = :customerNo")
    List<GoldTbl> findByCustomerCustomerNo(@Param("customerNo") Long customerNo);
    
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gTransactionType = :transactionType")
    List<GoldTbl> findByGTransactionType(@Param("transactionType") GoldTbl.TransactionType transactionType);
    
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gQuantity = :quantity")
    List<GoldTbl> findByGQuantity(@Param("quantity") BigDecimal quantity);
    
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gTotalPrice = :totalPrice")
    List<GoldTbl> findByGTotalPrice(@Param("totalPrice") BigDecimal totalPrice);

    // 복잡한 쿼리들
    @Query("SELECT gt FROM GoldTbl gt LEFT JOIN FETCH gt.goldProduct WHERE gt.customer.customerNo = :customerNo ORDER BY gt.gPurchasedAt DESC")
    List<GoldTbl> findByCustomerNo(@Param("customerNo") Long customerNo);

    @Query("SELECT gt FROM GoldTbl gt LEFT JOIN FETCH gt.goldProduct WHERE gt.customer.customerNo = :customerNo AND gt.gTransactionType = :transactionType ORDER BY gt.gPurchasedAt DESC")
    List<GoldTbl> findByCustomerNoAndTransactionType(@Param("customerNo") Long customerNo,
                                                             @Param("transactionType") GoldTbl.TransactionType transactionType);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gPurchasedAt BETWEEN :startDate AND :endDate ORDER BY gt.gPurchasedAt DESC")
    List<GoldTbl> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.customer.customerNo = :customerNo AND gt.gPurchasedAt BETWEEN :startDate AND :endDate ORDER BY gt.gPurchasedAt DESC")
    List<GoldTbl> findByCustomerNoAndDateRange(@Param("customerNo") Long customerNo,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.goldProduct.gpMetalCode = :metalCode AND gt.gTransactionType = :transactionType")
    List<GoldTbl> findByMetalCodeAndTransactionType(@Param("metalCode") String metalCode,
                                                            @Param("transactionType") GoldTbl.TransactionType transactionType);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gTotalPrice BETWEEN :minAmount AND :maxAmount")
    List<GoldTbl> findByAmountRange(@Param("minAmount") BigDecimal minAmount,
                                            @Param("maxAmount") BigDecimal maxAmount);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.gQuantity >= :minQuantity AND gt.gQuantity <= :maxQuantity")
    List<GoldTbl> findByQuantityRange(@Param("minQuantity") BigDecimal minQuantity,
                                              @Param("maxQuantity") BigDecimal maxQuantity);

    // 페이징 메서드들
    @Query("SELECT gt FROM GoldTbl gt WHERE gt.customer.customerNo = :customerNo ORDER BY gt.gPurchasedAt DESC")
    Page<GoldTbl> findByCustomerNo(@Param("customerNo") Long customerNo, Pageable pageable);

    @Query("SELECT gt FROM GoldTbl gt WHERE gt.customer.customerNo = :customerNo AND gt.gTransactionType = :transactionType ORDER BY gt.gPurchasedAt DESC")
    Page<GoldTbl> findByCustomerNoAndTransactionType(@Param("customerNo") Long customerNo,
                                                    @Param("transactionType") GoldTbl.TransactionType transactionType,
                                                    Pageable pageable);

    // 동적 조건 페이징 조회 (null 값 처리)
    @Query("SELECT gt FROM GoldTbl gt JOIN gt.goldProduct gp WHERE gt.customer.customerNo = :customerNo " +
           "AND (:transactionType IS NULL OR gt.gTransactionType = :transactionType) " +
           "AND (:metalCode IS NULL OR gp.gpMetalCode = :metalCode) " +
           "AND (:walletName IS NULL OR gt.gWalletName = :walletName) " +
           "ORDER BY gt.gPurchasedAt DESC")
    Page<GoldTbl> findByCustomerNoWithDynamicConditions(@Param("customerNo") Long customerNo,
                                                        @Param("transactionType") String transactionType,
                                                        @Param("metalCode") String metalCode,
                                                        @Param("walletName") String walletName,
                                                        Pageable pageable);
}