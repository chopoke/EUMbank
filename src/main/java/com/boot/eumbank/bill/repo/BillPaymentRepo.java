package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillPayment;

public interface BillPaymentRepo extends JpaRepository<BillPayment,Integer>{
    List<BillPayment> findByBiNoOrderByBpPaidAtDesc(Integer biNo);
}