package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.ElectricAvg;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ElectricAvgRepo extends JpaRepository<ElectricAvg,Integer> {
    List<ElectricAvg> findByEaYearAndEaMonth(Integer y, Integer m);
}