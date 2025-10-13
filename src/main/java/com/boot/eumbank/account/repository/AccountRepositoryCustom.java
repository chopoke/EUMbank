package com.boot.eumbank.account.repository;

import com.boot.eumbank.account.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface AccountRepositoryCustom {

    // 계좌 목록
    List<Account> findAccountsByCustomer(int c_no);
    Optional<Account> findByAccountNo(String a_account_no);
    Optional<Account> findByAccountId(String a_id);

    // 페이지네이션 버전
    Page<Account> findAccountsByCustomer(int c_no, Pageable pageable);
}
