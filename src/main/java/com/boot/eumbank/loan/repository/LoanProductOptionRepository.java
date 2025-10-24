package com.boot.eumbank.loan.repository;

import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanProductOptionRepository extends JpaRepository<LoanProductOption, Integer> {

    List<LoanProductOption> findByProduct(LoanProduct product);
    void deleteAllByProduct(LoanProduct product);
}
