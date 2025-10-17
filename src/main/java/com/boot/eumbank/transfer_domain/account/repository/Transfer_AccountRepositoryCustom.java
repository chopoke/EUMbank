package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.Open.model.Account;

import java.util.List;
import java.util.Optional;

/**
 * AccountRepository Custom 인터페이스 (QueryDSL 사용)
 */
public interface Transfer_AccountRepositoryCustom {

    /**
     * 활성 계좌만 조회
     */
    Optional<Account> findActiveAccountByAccountId(String accountId);

    /**
     * 고객의 활성 계좌 목록 조회
     */
    List<Account> findActiveAccountsByCustomerId(Integer customerNo);

    /**
     * 계좌 유형별 계좌 조회
     */
    List<Account> findAccountsByCustomerIdAndType(Integer customerNo, String accountType);

    /**
     * 최근 거래가 있는 계좌 조회
     */
    List<Account> findRecentlyUsedAccountsByCustomerId(Integer customerNo);

    /**
     * 잔액 기준 상위 계좌 조회
     */
    List<Account> findAccountsByBalanceDesc(Integer customerNo);
}
