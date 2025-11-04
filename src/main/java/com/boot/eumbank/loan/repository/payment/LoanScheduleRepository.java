package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.LoanSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 스케쥴 레포(커스텀 상속)
 */
public interface LoanScheduleRepository extends JpaRepository<LoanSchedule, Long>, LoanScheduleRepositoryCustom {

    List<LoanSchedule> findByLoanNoOrderByInstallmentNoAsc(Long loanNo);
}
