package com.boot.eumbank.loan.repository;


import com.boot.eumbank.loan.entity.LoanProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanProductRepository extends JpaRepository<LoanProduct, Integer> {
    Optional<LoanProduct> findByLoanCode(String loanCode);

    Page<LoanProduct> findByLoanTypeAndStatus(
            String loanType, String status, Pageable pageable);
}
