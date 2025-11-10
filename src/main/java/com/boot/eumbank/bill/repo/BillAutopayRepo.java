package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillAutopay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillAutopayRepo extends JpaRepository<BillAutopay,Integer> {
    Optional<BillAutopay> findByUbNoAndBaActive(Integer ubNo, String active);
}
