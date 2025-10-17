package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CustomerRepository QueryDSL 구현체
 */
@Repository
@RequiredArgsConstructor
public class Transfer_CustomerRepositoryImpl implements Transfer_CustomerRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QCustomer customer = QCustomer.customer;

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    @Override
    public Optional<Customer> findByCustomerNo(Long customerNo) {
        Customer result = queryFactory
                .selectFrom(customer)
                .where(customer.customerNo.eq(customerNo.intValue()))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    /**
     * 활성 고객만 조회
     */
    @Override
    public Optional<Customer> findActiveCustomerByCustomerId(String customerId) {
        Customer result = queryFactory
                .selectFrom(customer)
                .where(customer.cId.eq(customerId)
                        .and(customer.cStatus.eq("ACTIVE")))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    /**
     * 인증 레벨별 고객 조회
     */
    @Override
    public List<Customer> findCustomersByMinAuthLevel(Integer authLevel) {
        return queryFactory
                .selectFrom(customer)
                .where(customer.cAuthLevel.goe(authLevel)
                        .and(customer.cStatus.eq("ACTIVE")))
                .fetch();
    }

    /**
     * 사용자 ID로 활성 고객 조회
     */
    @Override
    public Optional<Customer> findActiveCustomerByUserId(String userId) {
        Customer result = queryFactory
                .selectFrom(customer)
                .where(customer.userId.eq(userId)
                        .and(customer.cStatus.eq("ACTIVE")))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    /**
     * 이메일로 활성 고객 조회
     */
    @Override
    public Optional<Customer> findActiveCustomerByEmail(String email) {
        Customer result = queryFactory
                .selectFrom(customer)
                .where(customer.cEmail.eq(email)
                        .and(customer.cStatus.eq("ACTIVE")))
                .fetchOne();
        return Optional.ofNullable(result);
    }
}
