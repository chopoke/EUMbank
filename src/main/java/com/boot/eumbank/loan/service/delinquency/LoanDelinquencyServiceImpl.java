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
import java.time.LocalDateTime;


/**
 * 연체 스냅샷 기록 서비스
 * 해당일(오늘)을 기준으로 해당 대출에서 얼마를 연체, 몇%를 연체이자로 보는비 1일1건 스냅
 */
@Service @Slf4j @RequiredArgsConstructor
public class LoanDelinquencyServiceImpl implements LoanDelinquencyService{

    private final LoanDelinquencyRepository delinquencyRepo;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)      // 실패할때마다 항상 등록되어야 하니 별개 트랜으로 분기
    public long upsertDailySnapshot(Long loanNo, Long scheduleIdOrNull, LocalDateTime asOfDate, BigDecimal penMarginPct, BigDecimal capPct, BigDecimal appliedDelRatePct, BigDecimal overdueAmt, BigDecimal delAmount, String waivedYn, String memo) {

        // 논리날짜 유지
        LocalDate asOfDay = asOfDate.toLocalDate();

        // 대출번호 + 날짜 조합ㅇ로 유니크키 생성하기
        String ldId = LdIdMaker.make(loanNo, asOfDate, scheduleIdOrNull);

        LoanDelinquency s = LoanDelinquency.builder()
                .loanNo(loanNo)
                .ldId(ldId)
                .scheduleId(scheduleIdOrNull)
                .calcDate(asOfDay.atStartOfDay()) // 시간만 00:00:00로 고정
                .penMargin(penMarginPct)
                .delRate(appliedDelRatePct)
                .capRate(capPct)
                .overdueAmt(overdueAmt)
                .delAmount(delAmount)           // 해당날짜의 연체이자
                .waivedYn(waivedYn == null ? "N" : waivedYn)
                .memo(memo)
                .build();


        log.info("@@ 연체발생 id={} loan_no={} 연체금액={} 누적금액={} @@", ldId, loanNo, overdueAmt, delAmount);

        return delinquencyRepo.upsertDaily(s);
        
    }

}
