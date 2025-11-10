package com.boot.eumbank.loan.repository.delinquency;

import com.boot.eumbank.loan.entity.LoanDelinquency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanDelinquencyRepository extends JpaRepository<LoanDelinquency, Long> , LoanDelinquencyRepositoryCustom {

}
