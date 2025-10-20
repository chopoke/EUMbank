package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * [이체 내역 레포지토리]
 * - 이체 내역 정보 조회 및 관리를 담당
 * - 주요 기능:
 *   1) 이체 내역 기본 CRUD 작업
 *   2) 계좌별 이체 내역 조회 (페이징 지원)
 *   3) 날짜별 이체 내역 필터링
 *   4) 이체 유형별 조회 (입금/출금)
 *   5) QueryDSL을 통한 복잡한 조회 쿼리 지원
 *   6) 이체 한도 검증을 위한 금액 합계 조회
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
public interface Transfer_TransferHistoryRepository extends JpaRepository<TransferHistory, Integer>, Transfer_TransferHistoryRepositoryCustom {

    /**
     * 거래 ID로 조회 (QueryDSL 사용)
     */
    Optional<TransferHistory> findByTransferId(String transferId);

    /**
     * 계좌별 거래 내역 조회 (페이징)
     */
    Page<TransferHistory> findByAccountNoOrderByTransferAtDesc(Integer accountNo, Pageable pageable);

    /**
     * 계좌별 거래 내역 조회 (리스트)
     */
    List<TransferHistory> findByAccountNoOrderByTransferAtDesc(Integer accountNo);

    /**
     * 기간별 거래 내역 조회
     */
    List<TransferHistory> findByAccountNoAndTransferAtBetween(Integer accountNo, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 거래 유형별 조회
     */
    List<TransferHistory> findByAccountNoAndTransferType(Integer accountNo, String transferType);

    /**
     * 금액 이상 거래 조회
     */
    List<TransferHistory> findByAccountNoAndAmountGreaterThanEqual(Integer accountNo, Integer amount);

    /**
     * 상대 계좌별 거래 조회
     */
    List<TransferHistory> findByAccountNoAndOtherAccount(Integer accountNo, String otherAccount);

    /**
     * 오늘 거래 내역 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT t FROM TransferHistory t WHERE t.accountNo = :accountNo AND DATE(t.transferAt) = CURRENT_DATE")
    List<TransferHistory> findTodayTransfers(@Param("accountNo") Integer accountNo);

    /**
     * 거래 타입별 조회
     */
    List<TransferHistory> findByAccountNoAndTransactionType(Integer accountNo, String transactionType);

    /**
     * 출금 거래 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT t FROM TransferHistory t WHERE t.accountNo = :accountNo AND t.transferType = '출금'")
    List<TransferHistory> findWithdrawalsByAccountNo(@Param("accountNo") Integer accountNo);

    /**
     * 입금 거래 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT t FROM TransferHistory t WHERE t.accountNo = :accountNo AND t.transferType = '입금'")
    List<TransferHistory> findDepositsByAccountNo(@Param("accountNo") Integer accountNo);
}
