package com.boot.eumbank.loan.repository.apply;

import com.boot.eumbank.loan.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long>, LoanApplicationRepositoryCustom {

    boolean existsByLaId(String laId);

    Optional<LoanApplication> findByLaId(String laId);

}
