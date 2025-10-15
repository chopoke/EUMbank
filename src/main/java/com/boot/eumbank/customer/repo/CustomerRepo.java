package com.boot.eumbank.customer.repo;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepo extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUserId(String userId);
    boolean existsByUserId(String userId);
    Optional<Customer> findByUserIdAndLoginType(String userId, String loginType);

    // 이메일 중복 체크 (대소문자 무시)
    @Query("""
           select case when count(c) > 0 then true else false end
           from Customer c
           where lower(c.cEmail) = lower(:email)
           """)
    boolean existsByEmailIgnoreCase(@Param("email") String email);
}