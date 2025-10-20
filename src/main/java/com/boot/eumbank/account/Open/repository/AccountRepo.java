package com.boot.eumbank.account.Open.repository;

import com.boot.eumbank.account.Open.model.Account;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface AccountRepo extends JpaRepository<Account, Long> {

    @Query("select (count(a) > 0) from Account a where a.aId = :aId")
    boolean existsByAId(@Param("aId") String aId);

    boolean existsByAccountNo(String accountNo);

    Optional<Account> findByAccountNo(String accountNo);

    // ✅ cNo 필드로 조회 — 파생쿼리 대신 JPQL로 명시
    @Query("select a from Account a where a.cNo = :cNo")
    List<Account> findByCNo(@Param("cNo") Integer cNo);

    // ↓ 상품코드 중복 체크
    boolean existsByProductCode(String productCode);
}

