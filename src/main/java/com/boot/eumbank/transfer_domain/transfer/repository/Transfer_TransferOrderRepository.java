package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;
import org.springframework.data.jpa.repository.JpaRepository;
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
     */
    List<TransferOrder> findByA_noOrderByTo_created_atDesc(Integer accountNo);

    /**
     * 계좌별 상태별 주문 조회
     */
    List<TransferOrder> findByA_noAndTo_status(Integer accountNo, String status);

    /**
     * 실행 대기 중인 주문 조회 (스케줄러용)
     */
    List<TransferOrder> findByTo_statusAndTo_start_atLessThanEqual(String status, LocalDateTime currentTime);

    /**
     * 완료된 주문 조회
     */
    List<TransferOrder> findByTo_status(String status);

    /**
     * 은행별 주문 조회
     */
    List<TransferOrder> findByA_noAndTo_bank_code(Integer accountNo, String bankCode);

    /**
     * 반복 주문 조회
     */
    List<TransferOrder> findByTo_schedule_type(String scheduleType);

    /**
     * 기간별 주문 조회
     */
    List<TransferOrder> findByA_noAndTo_start_atBetween(Integer accountNo, LocalDateTime startDate, LocalDateTime endDate);
}
