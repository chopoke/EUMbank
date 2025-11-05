package com.boot.eumbank.loan.admin.repository;


import com.boot.eumbank.loan.entity.LoanApplicationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanApplicationHistoryRepository extends JpaRepository<LoanApplicationHistory, Long> {
}
