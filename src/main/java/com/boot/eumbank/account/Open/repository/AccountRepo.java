// src/main/java/com/boot/eumbank/account/Open/repository/AccountRepo.java
package com.boot.eumbank.account.Open.repository;

import com.boot.eumbank.account.Open.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepo extends JpaRepository<Account, Long> {

    @Query("select (count(a) > 0) from Account a where a.aId = :aId")
    boolean existsByAId(@Param("aId") String aId);

    // 기존 파생 쿼리(엔티티 프로퍼티명이 accountNo일 때 사용)
    boolean existsByAccountNo(String accountNo);
    Optional<Account> findByAccountNo(String accountNo);

    // 서비스에서 사용하는 메서드와 이름을 맞춘 버전
    // 엔티티 프로퍼티명이 aAccountNo가 아닐 수 있어 안전하게 nativeQuery로 처리
    @Query(value = "select * from account_tbl a where a.a_account_no = :accountNo limit 1", nativeQuery = true)
    Optional<Account> findByAAccountNo(@Param("accountNo") String accountNo);

    @Query(value = "select case when count(*)>0 then true else false end " +
            "from account_tbl a where a.a_account_no = :accountNo", nativeQuery = true)
    boolean existsByAAccountNo(@Param("accountNo") String accountNo);

    // cNo로 조회
    @Query("select a from Account a where a.cNo = :cNo")
    List<Account> findByCNo(@Param("cNo") Integer cNo);

    // 상품코드 중복 체크
    boolean existsByProductCode(String productCode);
}
