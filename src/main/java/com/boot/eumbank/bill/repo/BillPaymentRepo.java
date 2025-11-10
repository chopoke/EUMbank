package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillPaymentRepo extends JpaRepository<BillPayment,Integer> {
    List<BillPayment> findByBiNoOrderByBpPaidAtDesc(Integer biNo);
}