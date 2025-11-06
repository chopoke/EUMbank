package com.boot.eumbank.loan.service.delinquency;


import com.boot.eumbank.loan.entity.LoanDelinquency;
import com.boot.eumbank.loan.repository.delinquency.LoanDelinquencyRepository;
import com.boot.eumbank.loan.util.LdIdMaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service @Slf4j @RequiredArgsConstructor
public class LoanDelinquencyServiceImpl implements LoanDelinquencyService{

    private final LoanDelinquencyRepository delinquencyRepo;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)      // 실패할때마다 항상 등록되어야 하니 별개 트랜으로 분기
    public long upsertDailySnapshot(Long loanNo, Long scheduleIdOrNull, LocalDate asOfDate, BigDecimal penMarginPct, BigDecimal capPct, BigDecimal appliedDelRatePct, BigDecimal overdueAmt, BigDecimal delAmount, String waivedYn, String memo) {

        String ldId = LdIdMaker.make(loanNo, asOfDate, scheduleIdOrNull);

        LoanDelinquency s = LoanDelinquency.builder()
                .loanNo(loanNo)
                .ldId(ldId)
                .scheduleId(scheduleIdOrNull)
                .calcDate(asOfDate.atStartOfDay()) // 00:00:00로 고정
                .penMargin(penMarginPct)
                .delRate(appliedDelRatePct)
                .capRate(capPct)
                .overdueAmt(overdueAmt)
                .delAmount(delAmount)
                .waivedYn(waivedYn == null ? "N" : waivedYn)
                .memo(memo)
                .build();


        log.info("@@@@@@@@@@ 연체발생 id={} loan_no={} 연체금액={} 누적금액={}", ldId, loanNo, overdueAmt, delAmount);

        return delinquencyRepo.upsertDaily(s);
        
    }

}
