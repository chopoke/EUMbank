package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillPaymentRepo extends JpaRepository<BillPayment, Integer> {
    Optional<BillPayment> findByBpIdempotencyKey(String key);
}