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
 * 예약 이체 주문 레포지토리 - QueryDSL 사용
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
     * 실행 대기 중인 주문 조회 (스케줄러용)
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT o FROM TransferOrder o WHERE o.to_status = :status AND o.to_start_at <= :currentTime")
    List<TransferOrder> findByStatusAndStartAtLessThanEqual(@Param("status") String status, @Param("currentTime") LocalDateTime currentTime);

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
