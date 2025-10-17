package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.account.Open.model.QAccount;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * AccountRepository QueryDSL 구현체
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
