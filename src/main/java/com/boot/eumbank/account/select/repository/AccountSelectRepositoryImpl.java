package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.account.Open.model.QAccount;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AccountSelectRepositoryImpl implements AccountRepositoryCustom {

    // 커스텀 리포의 구현체에선 JPAQueryFactory를 주입 받아 사용
    private final JPAQueryFactory jpaQueryFactory;

    @Override
    public List<Account> findAccountsByCustomer(int c_no) {
        return jpaQueryFactory
                .selectFrom(QAccount.account)
                .where(QAccount.account.cNo.eq(c_no))
                .orderBy(QAccount.account.aNo.desc())
                .fetch();
    }

    @Override
    public Optional<Account> findByAccountNo(String a_account_no) {
        Account one = jpaQueryFactory.selectFrom(QAccount.account)
                .where(QAccount.account.accountNo.eq(a_account_no))
                .fetchFirst();      // 유니크면 fetchOne 모르겠으면 fetchFirst
        return Optional.ofNullable(one);
    }

    @Override
    public Optional<Account> findByAccountId(String a_id) {
        Account one = jpaQueryFactory
                .selectFrom(QAccount.account)
                .where(QAccount.account.aId.eq(a_id))
                .fetchOne();
        return Optional.ofNullable(one);
    }

    // 페이지네이션 적용 버전
    @Override
    public Page<Account> findAccountsByCustomer(int c_no, Pageable pageable) {
        // 내용
        List<Account> content = jpaQueryFactory
                .selectFrom(QAccount.account)
                .where(QAccount.account.cNo.eq(c_no))
                .orderBy(QAccount.account.aNo.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 갯수
        Long total = jpaQueryFactory
                .select(QAccount.account.count())
                .from(QAccount.account)
                .where(QAccount.account.cNo.eq(c_no))
                .fetchOne();

        long safeTotal = (total != null) ? total : 0L;

        return new PageImpl<>(content, pageable,safeTotal);
    }
}
