package com.boot.eumbank.loan.admin.repository;

import com.boot.eumbank.loan.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanAdminRepository extends JpaRepository<LoanApplication, Long>, LoanAdminRepositoryCustom {
}
