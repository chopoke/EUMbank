package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * [이체 내역 레포지토리 커스텀 인터페이스]
 * - QueryDSL을 사용한 동적 쿼리 및 복잡한 조회 기능 제공
 * - JpaRepository의 기본 메서드로 처리하기 어려운 쿼리를 정의
 * - 주요 기능:
 *   1) 다양한 조건으로 이체 내역 조회
 *   2) 통계 데이터 조회 (일일/월간 출금 합계)
 *   3) 페이징 처리된 조회
 */
public interface Transfer_TransferHistoryRepositoryCustom {

    /**
     * [거래 ID로 단건 조회]
     * - 고유한 이체 ID로 특정 이체 내역 조회
     * @param transferId 이체 ID (th_transfer_id)
     * @return 이체 내역 (Optional)
     */
    Optional<TransferHistory> findByTransferId(String transferId);

    /**
     * [계좌별 거래 내역 조회 - 페이징]
     * - 특정 계좌의 이체 내역을 최신순으로 페이징 처리하여 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param pageable 페이징 정보 (페이지 번호, 크기)
     * @return 이체 내역 페이지 (Page)
     */
    Page<TransferHistory> findByAccountNoOrderByTransferAtDesc(Long accountNo, Pageable pageable);

    /**
     * [계좌별 거래 내역 조회 - 리스트]
     * - 특정 계좌의 이체 내역을 최신순으로 리스트 형태로 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param pageable 페이징 정보 (limit 용도)
     * @return 이체 내역 리스트
     */
    List<TransferHistory> findByAccountNoOrderByTransferAtDescList(Long accountNo, Pageable pageable);

    /**
     * [기간별 거래 내역 조회]
     * - 특정 계좌의 특정 기간 동안의 이체 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 기간 내 이체 내역 리스트
     */
    List<TransferHistory> findByAccountNoAndTransferAtBetween(Long accountNo, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * [거래 유형별 조회]
     * - 특정 계좌의 특정 거래 유형(입금/출금) 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param transferType 거래 유형 (입금/출금/TRANSFER)
     * @return 거래 유형별 내역 리스트
     */
    List<TransferHistory> findByAccountNoAndTransferType(Long accountNo, String transferType);

    /**
     * [금액 이상 거래 조회]
     * - 특정 계좌에서 특정 금액 이상의 거래 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param amount 최소 금액
     * @return 특정 금액 이상 거래 내역 리스트
     */
    List<TransferHistory> findByAccountNoAndAmountGreaterThanEqual(Long accountNo, Integer amount);

    /**
     * [상대 계좌별 거래 조회]
     * - 특정 계좌에서 특정 상대방 계좌로의 거래 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param otherAccount 상대방 계좌번호
     * @return 상대방 계좌로의 거래 내역 리스트
     */
    List<TransferHistory> findByAccountNoAndOtherAccount(Long accountNo, String otherAccount);

    /**
     * [고객별 거래 내역 조회]
     * - 특정 고객의 모든 계좌 거래 내역 조회 (Account 조인 필요)
     * @param customerId 고객 ID (c_id)
     * @param pageable 페이징 정보
     * @return 고객의 모든 계좌 거래 내역 리스트
     */
    List<TransferHistory> findByCustomerIdOrderByTransferAtDesc(String customerId, Pageable pageable);

    /**
     * [오늘 거래 내역 조회]
     * - 특정 계좌의 오늘(00:00 ~ 23:59) 거래 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @return 오늘 거래 내역 리스트
     */
    List<TransferHistory> findTodayTransfers(Long accountNo);

    /**
     * [거래 타입별 조회]
     * - 특정 계좌의 특정 거래 타입(DEPOSIT/WITHDRAW) 내역 조회
     * @param accountNo 계좌 번호 (a_no)
     * @param transactionType 거래 타입 (DEPOSIT/WITHDRAW/INTERNAL_TRANSFER_IN/OUT)
     * @return 거래 타입별 내역 리스트
     */
    List<TransferHistory> findByAccountNoAndTransactionType(Long accountNo, String transactionType);

    /**
     * [출금 거래 조회]
     * - 특정 계좌의 출금 거래만 조회 (th_account_out > 0)
     * @param accountNo 계좌 번호 (a_no)
     * @return 출금 거래 내역 리스트
     */
    List<TransferHistory> findWithdrawalsByAccountNo(Long accountNo);

    /**
     * [입금 거래 조회]
     * - 특정 계좌의 입금 거래만 조회 (th_account_in > 0)
     * @param accountNo 계좌 번호 (a_no)
     * @return 입금 거래 내역 리스트
     */
    List<TransferHistory> findDepositsByAccountNo(Long accountNo);

    /**
     * [일일 출금 합계 조회]
     * - 특정 계좌의 오늘 출금 금액 합계 조회 (1일 한도 검증용)
     * @param accountNo 계좌 번호 (a_no)
     * @return 오늘 출금 합계 금액
     */
    Integer getTodayWithdrawSum(Long accountNo);

    /**
     * [월간 출금 합계 조회]
     * - 특정 계좌의 이번 달 출금 금액 합계 조회 (1월 한도 검증용)
     * @param accountNo 계좌 번호 (a_no)
     * @return 이번 달 출금 합계 금액
     */
    Integer getMonthlyWithdrawSum(Long accountNo);
}
