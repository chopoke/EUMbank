package com.boot.eumbank.loan.repository;

import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRateOptionRepository extends JpaRepository<LoanRateOption, Long> {
    List<LoanRateOption> findByProduct(LoanProduct product);
}
