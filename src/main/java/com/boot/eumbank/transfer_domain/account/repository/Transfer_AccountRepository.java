package com.boot.eumbank.transfer_domain.account.repository;


import com.boot.eumbank.account.open.entity.account.Account;
import jakarta.persistence.LockModeType;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 계좌 레포지토리]
 * - 이체 관련 계좌 정보 조회 및 수정을 담당
 * - 주요 기능:
 *   1) 계좌 기본 CRUD 작업
 *   2) 비관적 잠금을 통한 동시성 제어
 *   3) 계좌번호 기반 조회
 *   4) 고객별 계좌 목록 조회
 *   5) 계좌 상태 및 타입별 필터링
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
public interface Transfer_AccountRepository extends JpaRepository<Account, Integer>, Transfer_AccountRepositoryCustom {

    // PK 조회는 JpaRepository<Account, Integer>의 findById(Integer id)를 사용
    // findByANo는 JPA 네이밍 규칙상 "ANo" 필드를 찾으려 하므로 사용 불가
    // (JPA는 카멜케이스에서 소문자 2개 이상으로 시작해야 함)

    /**
     * 계좌번호로 계좌 조회
     */
    Optional<Account> findByAccountNo(String accountNo);

    /**
     * PK로 계좌 조회 (비관적 락 적용)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.aNo = :aNo")
    Optional<Account> findByIdWithLock(@Param("aNo") Integer aNo);

    /**
     * 계좌번호로 계좌 조회 (비관적 락 적용)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountNo = :accountNo")
    Optional<Account> findByAccountNoWithLock(@Param("accountNo") String accountNo);

    /**
     * 고객 번호로 계좌 목록 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT a FROM Account a WHERE a.cNo = :cNo")
    List<Account> findByCNo(@Param("cNo") Integer cNo);

    /**
     * 고객 번호로 원화 계좌 목록만 조회 (이체 가능한 계좌)
     * - currency가 'KRW'이거나 null인 계좌만 조회
     * - ACTIVE 상태인 계좌만 조회
     * - 예금/적금 계좌 제외 (입출금 계좌만 조회)
     */
    @Query("SELECT a FROM Account a WHERE a.cNo = :cNo " +
           "AND (a.currency = 'KRW' OR a.currency IS NULL) " +
           "AND a.status = 'ACTIVE' " +
           "AND (a.accountType IS NULL OR a.accountType NOT IN ('예금', '적금', 'deposit', 'saving', 'DEPOSIT', 'SAVING'))")
    List<Account> findByCNoAndCurrencyKRW(@Param("cNo") Integer cNo);

    /**
     * 활성 계좌만 조회 (QueryDSL 사용)
     */
    Optional<Account> findActiveAccountByAccountId(String accountId);

    /**
     * 고객의 활성 계좌 목록 조회 (QueryDSL 사용)
     */
    List<Account> findActiveAccountsByCustomerId(Integer customerNo);

    /**
     * 계좌번호 존재 여부 확인
     */
    boolean existsByAccountNo(String accountNo);

    // PK 존재 확인은 JpaRepository<Account, Integer>의 existsById(Integer id)를 사용
    // existsByANo는 JPA 네이밍 규칙상 "ANo" 필드를 찾으려 하므로 사용 불가
    // (JPA는 카멜케이스에서 소문자 2개 이상으로 시작해야 함)

    /**
     * 계좌 유형별 계좌 조회 (QueryDSL 사용)
     */
    List<Account> findAccountsByCustomerIdAndType(Integer customerNo, String accountType);

    /**
     * 최근 거래가 있는 계좌 조회 (QueryDSL 사용)
     */
    List<Account> findRecentlyUsedAccountsByCustomerId(Integer customerNo);

    /**
     * 잔액 기준 상위 계좌 조회 (QueryDSL 사용)
     */
    List<Account> findAccountsByBalanceDesc(Integer customerNo);
}
