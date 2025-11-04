package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 상환연결 레포
 */
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
}
