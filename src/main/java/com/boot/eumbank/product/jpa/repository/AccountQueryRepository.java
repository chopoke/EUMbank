package com.boot.eumbank.product.jpa.repository;

import com.boot.eumbank.account.open.entity.account.Account;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.boot.eumbank.account.open.entity.account.QAccount.account;

@Repository
@RequiredArgsConstructor
public class AccountQueryRepository {

    private final JPAQueryFactory queryFactory;

    private Logger logger = LoggerFactory.getLogger(AccountQueryRepository.class);

    /**
     * 계좌에 가져오기
     * @return
     */
    public List<Account> findAllAccount(Integer accountNo) {

        logger.info("AccountQueryRepository => findAllAccount()");

        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(accountNo).and(account.status.eq("ACTIVE")))
                .fetch();

    }

    /**
     * 특정 계좌에 가져오기
     * @return
     */
    public Account findAOneAccount(Integer accountNo) {

        logger.info("AccountQueryRepository => findAOneAccount()");

        return queryFactory
                .selectFrom(account)
                .where(account.aNo.eq(accountNo))
                .fetchOne();

    }



}
