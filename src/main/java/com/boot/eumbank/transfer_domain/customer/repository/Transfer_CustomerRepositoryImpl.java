package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 고객 레포지토리 QueryDSL 구현체]
 * - Transfer_CustomerRepositoryCustom 인터페이스의 QueryDSL 구현
 * - 복잡한 고객 조회 쿼리를 QueryDSL로 구현
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
public class Transfer_CustomerRepositoryImpl implements Transfer_CustomerRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QCustomer customer = QCustomer.customer;

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    @Override
    public Optional<Customer> findByCustomerNo(Integer customerNo) {
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
