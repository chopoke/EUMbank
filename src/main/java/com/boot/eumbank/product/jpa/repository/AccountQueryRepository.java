package com.boot.eumbank.product.jpa.repository;

import com.boot.eumbank.account.open.controller.AccountController;
import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.AccountDto;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import static com.boot.eumbank.account.open.entity.account.QAccount.account;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class AccountQueryRepository {

    private final JPAQueryFactory queryFactory;

    private Logger logger = LoggerFactory.getLogger(AccountQueryRepository.class);

    /**
     * 계좌에 가져오기
     * @return
     */
    public List<Account> findAllAccount() {

        logger.info("AccountQueryRepository => findAllAccount()");

        return queryFactory
                .selectFrom(account)
                .fetch();

    }

    /**
     * 예금 상품등록을 위한 특정 게좌 조회
     * @return
     */
    public Account findOneAccount(Customer customer) {

        logger.info("AccountQueryRepository => findOneAccount()");

        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customer.getCustomerNo()))
                .fetchOne();

    }

}
