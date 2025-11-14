package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.GasRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GasRateRepo extends JpaRepository<GasRate, Integer> {
    @Query("select g from GasRate g order by g.grEffFrom desc limit 1")
    GasRate latest();
}
