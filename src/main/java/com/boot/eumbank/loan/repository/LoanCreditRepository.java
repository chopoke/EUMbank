package com.boot.eumbank.loan.repository;

import com.boot.eumbank.loan.entity.LoanCreditOption;
import com.boot.eumbank.loan.entity.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoanCreditRepository extends JpaRepository<LoanCreditOption, Long> {
    List<LoanCreditOption> findByLoanProduct(LoanProduct product);
    Optional<LoanCreditOption> findByLoanProductAndRateType(LoanProduct product, String rateType);
}
