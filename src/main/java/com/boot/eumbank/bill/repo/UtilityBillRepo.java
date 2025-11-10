package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.UtilityBill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtilityBillRepo extends JpaRepository<UtilityBill,Integer> {
    Optional<UtilityBill> findByBpCodeAndUbId(String bpCode, String ubId);
    List<UtilityBill> findByCNo(Integer cNo);
}
