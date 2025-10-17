package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 고객 레포지토리
 */
@Repository
public interface Transfer_CustomerRepository extends JpaRepository<Customer, Long>, Transfer_CustomerRepositoryCustom {

    /**
     * 고객 ID로 고객 조회
     */
    Optional<Customer> findByCId(String cId);

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    Optional<Customer> findByCustomerNo(Long customerNo);

    /**
     * 사용자 ID로 고객 조회
     */
    Optional<Customer> findByUserId(String userId);

    /**
     * 이메일로 고객 조회
     */
    Optional<Customer> findByCEmail(String cEmail);

    /**
     * 휴대전화로 고객 조회
     */
    Optional<Customer> findByCPhoneMobile(String cPhoneMobile);

    /**
     * 고객 ID 존재 여부 확인
     */
    boolean existsByCId(String cId);

    /**
     * 사용자 ID 존재 여부 확인
     */
    boolean existsByUserId(String userId);

    /**
     * 이메일 존재 여부 확인
     */
    boolean existsByCEmail(String cEmail);

    /**
     * 활성 고객만 조회 (QueryDSL 사용)
     */
    Optional<Customer> findActiveCustomerByCustomerId(String customerId);

    /**
     * 인증 레벨별 고객 조회 (QueryDSL 사용)
     */
    List<Customer> findCustomersByMinAuthLevel(Integer authLevel);
}
