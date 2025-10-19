package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.transfer_domain.account.entity.AccountLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * [이체 도메인 계좌 한도 레포지토리]
 * - 계좌별 이체 한도 정보 조회 및 관리를 담당
 * - 주요 기능:
 *   1) 계좌 한도 기본 CRUD 작업
 *   2) 계좌번호 기반 한도 조회
 *   3) 이체 한도 검증을 위한 데이터 제공
 *   4) 1회/일일/월간 한도 관리
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Repository
public interface Transfer_AccountLimitRepository extends JpaRepository<AccountLimit, Integer> {

    /**
     * 계좌 번호로 계좌 한도 조회
     */
    Optional<AccountLimit> findByAccountNo(Integer accountNo);

    /**
     * 계좌 한도 존재 여부 확인
     */
    boolean existsByAccountNo(Integer accountNo);
}
