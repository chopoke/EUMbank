package com.boot.eumbank.account.Open.service.Impl;

import com.boot.eumbank.account.Open.dto.CustomerDTO;
import com.boot.eumbank.account.Open.mapper.AccountMapper;
import com.boot.eumbank.account.Open.repository.custom.Custom;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringTemplate;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;


@Service
@RequiredArgsConstructor
public class CustomRepositoryImpl implements Custom {

    private final JPAQueryFactory qf;          // QueryDSL 주입 (Config에서 빈 등록)

    private final Logger logger = LoggerFactory.getLogger(CustomRepositoryImpl.class);

    /**
     *
     * FK 값을 가져오기 위함
     * @param map
     * @return
     */
    @Override
    public CustomerDTO getAccount(Map<String, Object> map) {

        logger.info("CustomRepositoryImpl => getAccount()");
        QCustomer qCustomer = QCustomer.customer;

        Map<String, Object> product = (Map<String, Object>) map.get("verification");
        String nameFromId = product != null ? (String) product.get("nameFromId") : null;
        String rrn6FromId = product != null ? (String) product.get("rrn6FromId") : null;

        StringTemplate birthDateFormatted = Expressions.stringTemplate(
                "DATE_FORMAT({0}, '%y%m%d')",
                qCustomer.cBirthDt
        );

        // 2. QueryDSL을 사용하여 DTO로 직접 조회
        logger.info("QueryDSL을 사용하여 DTO로 직접 조회");
        CustomerDTO customer = qf
                .select(Projections.constructor(CustomerDTO.class,
                        qCustomer.customerNo,
                        qCustomer.cNameKr,
                        qCustomer.cBirthDt,
                        qCustomer.cEmail,
                        qCustomer.cPhoneMobile
                ))
                .from(qCustomer)
                .where(
                        qCustomer.cNameKr.eq(nameFromId),       // 조건 1: 이름 일치
                        birthDateFormatted.eq(rrn6FromId)       // 조건 2: 생년월일 6자리 일치
                )
                .fetchOne(); // 단일 건 조회 (결과가 없거나 1건)

        logger.info("customer={}", customer);
        System.out.println("customer = " + customer);

        return customer;
    }
}
