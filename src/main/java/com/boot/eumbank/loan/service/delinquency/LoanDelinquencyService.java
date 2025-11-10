package com.boot.eumbank.loan.service.delinquency;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface LoanDelinquencyService {

    public long upsertDailySnapshot(Long loanNo, Long scheduleIdOrNull, LocalDate asOfDate, BigDecimal penMarginPct,
                                    BigDecimal capPct, BigDecimal appliedDelRatePct, BigDecimal overdueAmt,
                                    BigDecimal delAmount, String waivedYn, String memo);
}
