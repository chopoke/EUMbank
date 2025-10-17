package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 이체 내역 레포지토리 - QueryDSL 사용
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
     */
    List<TransferHistory> findTodayTransfers(Integer accountNo);

    /**
     * 거래 타입별 조회
     */
    List<TransferHistory> findByAccountNoAndTransactionType(Integer accountNo, String transactionType);

    /**
     * 출금 거래 조회
     */
    List<TransferHistory> findWithdrawalsByAccountNo(Integer accountNo);

    /**
     * 입금 거래 조회
     */
    List<TransferHistory> findDepositsByAccountNo(Integer accountNo);
}
