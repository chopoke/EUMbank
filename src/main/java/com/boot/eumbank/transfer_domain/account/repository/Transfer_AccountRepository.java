package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.Open.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 계좌 레포지토리 - DB의 a_no (Integer)를 기본 키로 사용
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
     * 고객 번호로 계좌 목록 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT a FROM Account a WHERE a.cNo = :cNo")
    List<Account> findByCNo(@Param("cNo") Integer cNo);

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
