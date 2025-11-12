package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillPaymentRepo extends JpaRepository<BillPayment,Integer> {
    List<BillPayment> findByBiNoOrderByBpPaidAtDesc(Integer biNo);
    // 최신 완료 결제 1건
    Optional<BillPayment> findTopByBiNoAndBpStatusOrderByBpPaidAtDesc(Integer biNo, String bpStatus);
}