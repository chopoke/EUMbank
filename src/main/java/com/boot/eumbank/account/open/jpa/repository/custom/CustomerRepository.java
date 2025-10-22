package com.boot.eumbank.account.open.jpa.repository.custom;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer,Integer>, CustomerRepositoryCustom {
}
