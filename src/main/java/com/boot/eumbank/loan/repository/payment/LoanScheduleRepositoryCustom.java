package com.boot.eumbank.loan.repository.payment;


import com.boot.eumbank.loan.entity.LoanSchedule;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 스케쥴 커스텀 레포
 * 시그니처 메서드 선언
 */
public interface LoanScheduleRepositoryCustom {

    /**
     * 상환 대상의 스케쥴을 DUE or PARTIAL 상태ㅔ서 납기일 오름차순으로 가져오기
     * @param loanNo
     * @return
     */
    List<LoanSchedule> findRepayTargets(Long loanNo);

    /**
     * 특정 대출을 상환용으로 잠그기(트랜)
     */
    void lockLoanRow(Long loanNo);

    List<LoanSchedule> findAllDueForAutoDebit(LocalDateTime dueDate);
    List<LoanSchedule> findNeedRetry(LocalDateTime forDate);
    List<LoanSchedule> findOverdueTargets(LocalDateTime asOfDate);
}
