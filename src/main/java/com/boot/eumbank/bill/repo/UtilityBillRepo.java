package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.UtilityBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UtilityBillRepo extends JpaRepository<UtilityBill, Integer> {
    @Query(value = """
            SELECT *
            FROM UTILITY_BILL_TBL
            WHERE c_no = :cNo
              AND ub_active = 'Y'
            ORDER BY ub_no ASC
            LIMIT 50
            """, nativeQuery = true)
    List<UtilityBill> findMyActive(@Param("cNo") Integer cNo);
}