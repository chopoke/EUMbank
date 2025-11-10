package com.boot.eumbank.loan.repository.delinquency;

import com.boot.eumbank.loan.entity.LoanDelinquency;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// 시느니처
public interface LoanDelinquencyRepositoryCustom {

    long upsertDaily(LoanDelinquency snapshot);

    BigDecimal sumDelAmountByLoanUntil(Long loanNo, LocalDateTime until);


    Optional<LoanDelinquency> findByLdId(String ldId);

    Optional<LoanDelinquency> findByLoanDateAndSchedule(Long loanNo, LocalDateTime calcDate, Long scheduleId);

    BigDecimal sumDelAmountByLoanBetween(Long loanNo, LocalDateTime from, LocalDateTime to);

    List<LoanDelinquency> findDailyByLoanBetween(Long loanNo, LocalDateTime from, LocalDateTime to, boolean asc);
}
