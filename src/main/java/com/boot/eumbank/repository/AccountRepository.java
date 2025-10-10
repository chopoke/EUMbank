package com.boot.eumbank.repository;

import com.boot.eumbank.model.Account;
import com.boot.eumbank.repository.custom.AccountCustom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, String>, AccountCustom {
}
