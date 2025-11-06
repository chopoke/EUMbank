package com.boot.eumbank.management.assetanalysis.repository;

import com.boot.eumbank.management.assetanalysis.entity.AssetGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 자산 목표 Repository (JPA 기본)
 */
public interface AssetGoalRepository extends JpaRepository<AssetGoal, Long> {

    /**
     * 고객번호로 활성 목표 조회
     */
    @Query("SELECT g FROM AssetGoal g WHERE g.customerNo = :customerNo AND g.isActive = 'Y'")
    Optional<AssetGoal> findActiveGoalByCustomerNo(@Param("customerNo") Integer customerNo);

    /**
     * 고객번호로 모든 목표 조회
     */
    @Query("SELECT g FROM AssetGoal g WHERE g.customerNo = :customerNo ORDER BY g.createdAt DESC")
    Optional<AssetGoal> findByCustomerNo(@Param("customerNo") Integer customerNo);
}




