package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.ElectricAvg;

public interface ElectricAvgRepo extends JpaRepository<ElectricAvg,Integer>{
    List<ElectricAvg> findByEaYearAndEaMonth(Integer y, Integer m);
}