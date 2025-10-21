package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.open.model.Account;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 계좌 레포지토리 커스텀 인터페이스]
 * - QueryDSL을 사용한 복잡한 계좌 조회 쿼리 정의
 * - 주요 기능:
 *   1) 활성 계좌 조회 (상태 필터링)
 *   2) 고객별 계좌 목록 조회
 *   3) 계좌 타입별 필터링
 *   4) 최근 사용 계좌 조회
 *   5) 잔액 순 정렬 조회
 * 
 * @author 임형욱
 * @since 2025-10-20
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
