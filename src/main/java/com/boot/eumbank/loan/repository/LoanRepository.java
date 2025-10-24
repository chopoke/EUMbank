package com.boot.eumbank.loan.repository;

import com.boot.eumbank.loan.entity.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<LoanProduct, Integer> {
    
    // 리스트
}
