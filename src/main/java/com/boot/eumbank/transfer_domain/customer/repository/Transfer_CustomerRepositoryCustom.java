package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;

import java.util.List;
import java.util.Optional;

/**
 * CustomerRepository Custom 인터페이스 (QueryDSL 사용)
 */
public interface Transfer_CustomerRepositoryCustom {

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    Optional<Customer> findByCustomerNo(Long customerNo);

    /**
     * 활성 고객만 조회
     */
    Optional<Customer> findActiveCustomerByCustomerId(String customerId);

    /**
     * 인증 레벨별 고객 조회
     */
    List<Customer> findCustomersByMinAuthLevel(Integer authLevel);

    /**
     * 사용자 ID로 활성 고객 조회
     */
    Optional<Customer> findActiveCustomerByUserId(String userId);

    /**
     * 이메일로 활성 고객 조회
     */
    Optional<Customer> findActiveCustomerByEmail(String email);
}
