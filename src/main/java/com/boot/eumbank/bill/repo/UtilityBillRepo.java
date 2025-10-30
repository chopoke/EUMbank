package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.UtilityBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

public interface UtilityBillRepo extends JpaRepository<UtilityBill, Integer>, QuerydslPredicateExecutor<UtilityBill> {}
