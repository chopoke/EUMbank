package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 고객 레포지토리 커스텀 인터페이스]
 * - QueryDSL을 사용한 복잡한 고객 조회 쿼리 정의
 * - 주요 기능:
 *   1) 고객 번호 기반 조회
 *   2) 활성 고객 필터링
 *   3) 고객 상태별 조회
 *   4) 복잡한 조건을 통한 고객 검색
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
public interface Transfer_CustomerRepositoryCustom {

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    Optional<Customer> findByCustomerNo(Integer customerNo);

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
