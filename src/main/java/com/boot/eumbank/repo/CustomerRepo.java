package com.boot.eumbank.repo;

import com.boot.eumbank.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepo extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
