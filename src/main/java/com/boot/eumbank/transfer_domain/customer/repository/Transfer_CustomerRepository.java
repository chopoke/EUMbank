package com.boot.eumbank.transfer_domain.customer.repository;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * [이체 도메인 고객 레포지토리]
 * - 이체 관련 고객 정보 조회 및 관리를 담당
 * - 주요 기능:
 *   1) 고객 기본 CRUD 작업
 *   2) 고객 ID/이메일/전화번호 기반 조회
 *   3) 이체 시 고객 정보 검증
 *   4) QueryDSL을 통한 복잡한 고객 조회
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
public interface Transfer_CustomerRepository extends JpaRepository<Customer, Integer>, Transfer_CustomerRepositoryCustom {

    /**
     * 고객 ID로 고객 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT c FROM Customer c WHERE c.cId = :cId")
    Optional<Customer> findByCId(@Param("cId") String cId);

    /**
     * 고객 번호(c_no)로 고객 조회
     */
    Optional<Customer> findByCustomerNo(Integer customerNo);

    /**
     * 사용자 ID로 고객 조회
     */
    Optional<Customer> findByUserId(String userId);

    /**
     * 이메일로 고객 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT c FROM Customer c WHERE c.email = :cEmail")
    Optional<Customer> findByCEmail(@Param("cEmail") String cEmail);

    /**
     * 휴대전화로 고객 조회
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT c FROM Customer c WHERE c.cPhoneMobile = :cPhoneMobile")
    Optional<Customer> findByCPhoneMobile(@Param("cPhoneMobile") String cPhoneMobile);

    /**
     * 고객 ID 존재 여부 확인
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.cId = :cId")
    boolean existsByCId(@Param("cId") String cId);

    /**
     * 사용자 ID 존재 여부 확인
     */
    boolean existsByUserId(String userId);

    /**
     * 이메일 존재 여부 확인
     * @Query 사용으로 JPA 네이밍 규칙 문제 회피
     */
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.email = :cEmail")
    boolean existsByCEmail(@Param("cEmail") String cEmail);

    /**
     * 활성 고객만 조회 (QueryDSL 사용)
     */
    Optional<Customer> findActiveCustomerByCustomerId(String customerId);

    /**
     * 인증 레벨별 고객 조회 (QueryDSL 사용)
     */
    List<Customer> findCustomersByMinAuthLevel(Integer authLevel);
}
