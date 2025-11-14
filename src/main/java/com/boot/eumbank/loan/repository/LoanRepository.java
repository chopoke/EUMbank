package com.boot.eumbank.loan.repository;

import com.boot.eumbank.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {

}
