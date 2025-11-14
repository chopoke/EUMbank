package com.boot.eumbank.account.open.jpa.repository.custom;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import static com.boot.eumbank.customer.entity.QCustomer.customer;

@Repository
@RequiredArgsConstructor
public class CustomerRepositoryImpl implements CustomerRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    private Logger logger = LoggerFactory.getLogger(CustomerRepositoryImpl.class);

    public boolean existsPinByUsername(String userId) {
        logger.info("CustomerRepositoryImpl => existsPinByUsername()");

        // select 1 from customer where username = ? and pin_number is not null
        Integer fetchFirst = queryFactory
                .selectOne() // 존재 여부만 확인하므로 select 1과 동일
                .from(customer)
                .where(
                        customer.cId.eq(userId),
                        customer.pinNumber.isNotEmpty() // pinNumber 컬럼이 빈값이 아닌지 확인
                )
                .fetchFirst(); // 결과가 있으면 1개만 가져오고, 없으면 null을 반환 (성능 최적화)

        // fetchFirst() 결과가 null이 아니면(존재하면) true 반환

        System.out.println(fetchFirst);
        return fetchFirst != null;
    }
}
