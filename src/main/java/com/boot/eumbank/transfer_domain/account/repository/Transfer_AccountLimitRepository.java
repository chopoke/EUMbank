package com.boot.eumbank.transfer_domain.account.repository;

import com.boot.eumbank.transfer_domain.account.entity.AccountLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 계좌 한도 레포지토리
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
