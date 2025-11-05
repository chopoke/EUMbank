package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 상환연결 레포
 */
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    // 멱등키와 no이 존재하는지 확인
    boolean existsByLoanNoAndIdempotencyKey(Long loanNo, String lpIdempotencyKey);

    // 멱등키와 no을 가진모든
    List<LoanPayment> findAllByLoanNoAndIdempotencyKey(Long loanNo, String idempotencyKey);
}
