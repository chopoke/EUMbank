package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillAutopay;

public interface BillAutopayRepo extends JpaRepository<BillAutopay,Integer>{
    Optional<BillAutopay> findByUbNoAndBaActive(Integer ubNo, String active);
}
