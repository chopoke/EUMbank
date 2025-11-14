package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.UtilityBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UtilityBillRepo extends JpaRepository<UtilityBill,Integer> {
    Optional<UtilityBill> findByBpCodeAndUbId(String bpCode, String ubId);
    @Query("select u from UtilityBill u where u.cNo = :cNo")
    List<UtilityBill> findByCNo(@Param("cNo") Integer cNo);
}
