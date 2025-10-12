package com.boot.eumbank.repository;

import com.boot.eumbank.entity.Account;
import com.boot.eumbank.service.AccountService;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer>, AccountRepositoryCustom {

    // JPQL 버전 --> Query DSL로 변경중
//    // 고객 보유 계좌 (customer.c_no 기준, 최신순)
//    @Query("""
//           select a
//           from Account a
//           where a.customer.c_no = :c_no
//           order by a.a_no desc
//           """)
//    List<Account> findAccountsByCustomer(@Param("c_no") int c_no);
//
//    // 계좌번호로 단건 조회
//    @Query("select a from Account a where a.a_account_no = :acc_no")
//    Optional<Account> findByAccountNo(@Param("acc_no") String acc_no);
//
//    // 계좌ID(비즈키)로 단건 조회
//    @Query("select a from Account a where a.a_id = :a_id")
//    Optional<Account> findByAccountId(@Param("a_id") String a_id);


}
