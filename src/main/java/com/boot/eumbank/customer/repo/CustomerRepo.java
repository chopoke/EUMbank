package com.boot.eumbank.customer.repo;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepo extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUserId(String userId);
    boolean existsByUserId(String userId);
    Optional<Customer> findByUserIdAndLoginType(String userId, String loginType);
}
