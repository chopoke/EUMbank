package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
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
    private final EntityManager em;
    private static final QAccount A = QAccount.account;


    @Override
    public List<Account> findAccountsByCustomer(int c_no) {
        return jpaQueryFactory
                .selectFrom(A)
                .where(A.cNo.eq(c_no))
                .orderBy(A.aNo.desc())
                .fetch();
    }

    @Override
    public Optional<Account> findByAccountNo(String a_account_no) {
        Account one = jpaQueryFactory.selectFrom(A)
                .where(A.accountNo.eq(a_account_no))
                .fetchFirst();      // 유니크면 fetchOne 모르겠으면 fetchFirst
        return Optional.ofNullable(one);
    }

    @Override
    public Optional<Account> findByAccountId(String a_id) {
        Account one = jpaQueryFactory
                .selectFrom(A)
                .where(A.aId.eq(a_id))
                .fetchOne();
        return Optional.ofNullable(one);
    }

    // 페이지네이션 적용 버전
    @Override
    public Page<Account> findAccountsByCustomer(int c_no, Pageable pageable) {
        // 내용
        List<Account> content = jpaQueryFactory
                .selectFrom(A)
                .where(A.cNo.eq(c_no))
                .orderBy(A.aNo.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        // 갯수
        Long total = jpaQueryFactory
                .select(A.count())
                .from(A)
                .where(A.cNo.eq(c_no))
                .fetchOne();

        long safeTotal = (total != null) ? total : 0L;

        return new PageImpl<>(content, pageable, safeTotal);
    }

    @Override
    public long updateNickname(int a_no, String nickname) {
        long updateCnt = jpaQueryFactory
                .update(A)
                .set(A.nickname , nickname)
                .where(A.aNo.eq(a_no))
                .execute();
        em.flush(); em.clear();     // 클리어해서 전값이 보이는 것 방지
        return updateCnt;
    }


}