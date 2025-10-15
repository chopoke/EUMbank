package com.boot.eumbank.account.Open.repository;

import com.boot.eumbank.account.Open.model.Account;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface AccountRepo extends JpaRepository<Account, Long> {

    @Query("select (count(a) > 0) from Account a where a.aId = :aId")
    boolean existsByAId(@Param("aId") String aId);

    boolean existsByAccountNo(String accountNo);
}
