package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.LoanPayment;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 상환연결 레포
 */
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    // 멱등키와 no이 존재하는지 확인
    boolean existsByLoanNoAndIdempotencyKey(Long loanNo, String lpIdempotencyKey);

    // 멱등키와 no을 가진모든
    List<LoanPayment> findAllByLoanNoAndIdempotencyKey(Long loanNo, String idempotencyKey);

    //  대출 단위로 지금까지 납부한 연체penalty 합
    @Query("select coalesce(sum(p.penaltyAmt), 0) " +
            "from LoanPayment p " +
            "where p.loanNo = :loanNo and p.paymentTime <= :until")
    BigDecimal sumPenaltyPaidByLoanUntil(@Param("loanNo") Long loanNo,
                                         @Param("until") LocalDateTime until);
}
