package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.Open.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 계좌 레포지토리 - DB의 a_no (Long)를 기본 키로 사용
 */
@Repository
public interface Transfer_AccountRepository extends JpaRepository<Account, Long>, Transfer_AccountRepositoryCustom {

    /**
     * 계좌 ID로 계좌 조회
     */
    Optional<Account> findByAId(String aId);

    /**
     * 계좌번호로 계좌 조회
     */
    Optional<Account> findByAccountNo(String accountNo);

    /**
     * 고객 번호로 계좌 목록 조회
     */
    List<Account> findByCNo(Integer cNo);

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

    /**
     * 계좌 ID 존재 여부 확인
     */
    boolean existsByAId(String aId);

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
