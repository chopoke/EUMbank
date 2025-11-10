package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.UtilityBill;

public interface UtilityBillRepo extends JpaRepository<UtilityBill,Integer>{
    Optional<UtilityBill> findByBpCodeAndUbId(String bpCode, String ubId);
    List<UtilityBill> findByCNo(Integer cNo);
}
