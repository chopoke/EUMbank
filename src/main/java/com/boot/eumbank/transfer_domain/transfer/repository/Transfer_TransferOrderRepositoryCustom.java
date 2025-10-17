package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * [예약 이체 레포지토리 커스텀 인터페이스]
 * - QueryDSL을 사용한 예약 이체 관련 복잡한 조회 기능 제공
 * - 예약 이체의 다양한 상태와 조건을 활용한 조회 메서드 정의
 * - 주요 기능:
 *   1) 상태별 예약 이체 조회 (ACTIVE, SCHEDULED, COMPLETED, CANCELLED)
 *   2) 스케줄 타입별 조회 (ONCE, RECURRING)
 *   3) 실행 시점 도래 주문 조회 (스케줄러용)
 */
public interface Transfer_TransferOrderRepositoryCustom {

    /**
     * [주문 ID로 단건 조회]
     * - 고유한 주문 ID로 예약 이체 조회
     * @param orderId 주문 ID (to_order_id)
     * @return 예약 이체 정보 (Optional)
     */
    Optional<TransferOrder> findByOrderId(Integer orderId);

    /**
     * [계좌별 주문 목록 조회]
     * - 특정 계좌의 모든 예약 이체를 최신순으로 조회
     * @param accountNo 계좌 번호 (a_no)
     * @return 예약 이체 목록
     */
    List<TransferOrder> findByAccountNoOrderByCreatedAtDesc(Long accountNo);

    /**
     * [계좌별 상태별 주문 조회]
     * - 특정 계좌의 특정 상태의 예약 이체만 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param status 주문 상태 (ACTIVE/SCHEDULED/COMPLETED/CANCELLED)
     * @return 상태별 예약 이체 목록
     */
    List<TransferOrder> findByAccountNoAndStatus(Long accountNo, String status);

    /**
     * [활성 주문 조회]
     * - 특정 계좌의 활성 상태(ACTIVE) 예약 이체만 조회
     * @param accountNo 계좌 번호 (a_no)
     * @return 활성 예약 이체 목록
     */
    List<TransferOrder> findActiveOrdersByAccountNo(Long accountNo);

    /**
     * [스케줄 타입별 주문 조회]
     * - 특정 계좌의 특정 스케줄 타입 예약 이체만 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param scheduleType 스케줄 타입 (ONCE/RECURRING)
     * @return 스케줄 타입별 예약 이체 목록
     */
    List<TransferOrder> findByAccountNoAndScheduleType(Long accountNo, String scheduleType);

    /**
     * [실행 대기 중인 주문 조회]
     * - 현재 시간 기준으로 실행 시점이 도래한 예약 이체 조회
     * - 스케줄러에서 사용 (30초마다 실행)
     * @param currentTime 현재 시간
     * @return 실행 대기 중인 예약 이체 목록
     */
    List<TransferOrder> findScheduledOrders(LocalDateTime currentTime);

    /**
     * [완료된 주문 조회]
     * - 종료 시간이 지난 예약 이체 조회
     * @param currentTime 현재 시간
     * @return 완료된 예약 이체 목록
     */
    List<TransferOrder> findCompletedOrders(LocalDateTime currentTime);

    /**
     * [은행별 주문 조회]
     * - 특정 계좌에서 특정 은행으로의 예약 이체 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param bankCode 은행 코드
     * @return 은행별 예약 이체 목록
     */
    List<TransferOrder> findByAccountNoAndBankCode(Long accountNo, String bankCode);

    /**
     * [고객별 주문 조회]
     * - 특정 고객의 모든 계좌의 예약 이체 조회 (Account 조인 필요)
     * @param customerId 고객 ID (c_id)
     * @return 고객의 모든 예약 이체 목록
     */
    List<TransferOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    /**
     * [반복 주문 조회]
     * - 반복성(RECURRING) 예약 이체만 조회
     * @return 반복 예약 이체 목록
     */
    List<TransferOrder> findRecurringOrders();

    /**
     * [예약 주문 조회]
     * - 스케줄된 상태(SCHEDULED)의 예약 이체만 조회
     * @return 스케줄된 예약 이체 목록
     */
    List<TransferOrder> findPendingOrders();

    /**
     * [기간별 주문 조회]
     * - 특정 계좌의 특정 기간 내 시작 예정인 예약 이체 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 기간 내 예약 이체 목록
     */
    List<TransferOrder> findByAccountNoAndStartAtBetween(Long accountNo, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * [완료된 주문 조회 - 계좌별]
     * - 특정 계좌의 완료된(COMPLETED) 예약 이체만 조회
     * @param accountNo 계좌 번호 (a_no)
     * @return 완료된 예약 이체 목록
     */
    List<TransferOrder> findCompletedOrdersByAccountNo(Long accountNo);

    /**
     * [취소된 주문 조회 - 계좌별]
     * - 특정 계좌의 취소된(CANCELLED) 예약 이체만 조회
     * @param accountNo 계좌 번호 (a_no)
     * @return 취소된 예약 이체 목록
     */
    List<TransferOrder> findCancelledOrdersByAccountNo(Long accountNo);
}
