package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * [예약 이체 주문 레포지토리]
 * - 예약 이체 주문 정보 조회 및 관리를 담당
 * - 주요 기능:
 *   1) 예약 이체 주문 기본 CRUD 작업
 *   2) 계좌별 예약 이체 목록 조회
 *   3) 실행 대기 중인 예약 이체 조회
 *   4) 스케줄러를 통한 자동 실행 지원
 *   5) 예약 이체 상태 관리 (SCHEDULED, EXECUTED, CANCELLED)
 *   6) QueryDSL을 통한 복잡한 조회 쿼리 지원
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
public interface Transfer_TransferOrderRepository extends JpaRepository<TransferOrder, Integer>, Transfer_TransferOrderRepositoryCustom {

    /**
     * 계좌별 주문 목록 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.a_no = :accountNo ORDER BY o.to_created_at DESC")
    List<TransferOrder> findByAccountNoOrderByCreatedAtDesc(@Param("accountNo") Integer accountNo);

    /**
     * 계좌별 상태별 주문 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.a_no = :accountNo AND o.to_status = :status")
    List<TransferOrder> findByAccountNoAndStatus(@Param("accountNo") Integer accountNo, @Param("status") String status);

    /**
     * 실행 대기 중인 주문 조회 (스케줄러용) - Race Condition 방지
     * Native SQL의 SELECT FOR UPDATE SKIP LOCKED를 사용하여 동시 실행 방지
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query(value = "SELECT * FROM transfer_order_tbl WHERE to_status = :status AND to_start_at <= :currentTime FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<TransferOrder> findByStatusAndStartAtLessThanEqualForUpdate(@Param("status") String status, @Param("currentTime") LocalDateTime currentTime);

    /**
     * 완료된 주문 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.to_status = :status")
    List<TransferOrder> findByStatus(@Param("status") String status);

    /**
     * 은행별 주문 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.a_no = :accountNo AND o.to_bank_code = :bankCode")
    List<TransferOrder> findByAccountNoAndBankCode(@Param("accountNo") Integer accountNo, @Param("bankCode") String bankCode);

    /**
     * 반복 주문 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.to_schedule_type = :scheduleType")
    List<TransferOrder> findByScheduleType(@Param("scheduleType") String scheduleType);

    /**
     * 기간별 주문 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.a_no = :accountNo AND o.to_start_at BETWEEN :startDate AND :endDate")
    List<TransferOrder> findByAccountNoAndStartAtBetween(@Param("accountNo") Integer accountNo, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
