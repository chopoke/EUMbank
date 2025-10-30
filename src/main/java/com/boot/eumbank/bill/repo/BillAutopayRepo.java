package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillAutopay;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillAutopayRepo extends JpaRepository<BillAutopay, Integer>, QuerydslPredicateExecutor<BillAutopay> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from BillAutopay a where a.bill.ubNo=:ubNo and a.baActive='Y'")
    List<BillAutopay> lockActiveByUbNo(@Param("ubNo") Integer ubNo);
}
