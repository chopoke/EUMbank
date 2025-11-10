package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.WaterRate;
import org.springframework.data.jpa.repository.Query;

public interface WaterRateRepo extends JpaRepository<WaterRate,Integer>{
    @Query("select w from WaterRate w order by w.wrEffFrom desc limit 1")
    WaterRate latest();
}
