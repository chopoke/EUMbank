package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.open.model.Account;
import com.boot.eumbank.account.open.model.QAccount;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 계좌 레포지토리 QueryDSL 구현체]
 * - Transfer_AccountRepositoryCustom 인터페이스의 QueryDSL 구현
 * - 복잡한 계좌 조회 쿼리를 QueryDSL로 구현
 * - 주요 기능:
 *   1) 동적 쿼리 생성 및 실행
 *   2) 복잡한 조인 및 서브쿼리 처리
 *   3) 정렬 및 필터링 로직 구현
 *   4) 성능 최적화된 쿼리 작성
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
@RequiredArgsConstructor
public class Transfer_AccountRepositoryImpl implements Transfer_AccountRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QAccount account = QAccount.account;

    /**
     * 활성 계좌만 조회
     */
    @Override
    public Optional<Account> findActiveAccountByAccountId(String accountId) {
        Account result = queryFactory
                .selectFrom(account)
                .where(account.aId.eq(accountId)
                        .and(account.status.eq("ACTIVE")))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    /**
     * 고객의 활성 계좌 목록 조회
     */
    @Override
    public List<Account> findActiveAccountsByCustomerId(Integer customerNo) {
        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customerNo)
                        .and(account.status.eq("ACTIVE")))
                .orderBy(account.openedAt.desc())
                .fetch();
    }

    /**
     * 계좌 유형별 계좌 조회
     */
    @Override
    public List<Account> findAccountsByCustomerIdAndType(Integer customerNo, String accountType) {
        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customerNo)
                        .and(account.accountType.eq(accountType))
                        .and(account.status.eq("ACTIVE")))
                .fetch();
    }

    /**
     * 최근 거래가 있는 계좌 조회
     */
    @Override
    public List<Account> findRecentlyUsedAccountsByCustomerId(Integer customerNo) {
        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customerNo)
                        .and(account.status.eq("ACTIVE"))
                        .and(account.lastTxAt.isNotNull()))
                .orderBy(account.lastTxAt.desc())
                .fetch();
    }

    /**
     * 잔액 기준 상위 계좌 조회
     */
    @Override
    public List<Account> findAccountsByBalanceDesc(Integer customerNo) {
        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customerNo)
                        .and(account.status.eq("ACTIVE")))
                .orderBy(account.balance.desc())
                .fetch();
    }
}
