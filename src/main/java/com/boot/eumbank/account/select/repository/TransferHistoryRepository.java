package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

import java.sql.Timestamp;

public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Integer> {

    @Query("""
        select t from TransferHistory t
        where t.accountNo = :a_no
          and (:type   is null or t.transferType = :type)
          and (:from_at is null or t.transferAt >= :from_at)
          and (:to_at   is null or t.transferAt <  :to_at)
        order by t.transferAt desc
    """)
    Page<TransferHistory> search(
            @Param("a_no") int a_no,
            @Param("type") String type,
            @Param("from_at") Timestamp from_at,
            @Param("to_at") Timestamp to_at,
            Pageable pageable
    );

    // 해당 계좌의 기간 내 트랜잭션 전부(입·출금 포함)
    List<TransferHistory> findByAccountNoAndTransferAtBetweenOrderByTransferAtAsc(
            Integer accountNo, LocalDateTime from, LocalDateTime to
    );

    //  진행률(납입 회차) 계산용
    long countByAccountNoAndTransactionType(Integer accountNo, String transactionType);
    @Query("""
        select t from TransferHistory t
        where t.otherAccount = :otherAccount
          and (:type   is null or t.transferType = :type)
          and (:fromAt is null or t.transferAt >= :fromAt)
          and (:toAt   is null or t.transferAt <  :toAt)
        order by t.transferAt desc
    """)
    Page<TransferHistory> searchByOtherAccount(
            @Param("otherAccount") String otherAccount,
            @Param("type") String type,
            @Param("fromAt") Timestamp fromAt,
            @Param("toAt") Timestamp toAt,
            Pageable pageable
    );

    // 상환내역 찍기
    boolean existsByAccountNoAndTransferId(Integer accountNo, String transferId);
}
