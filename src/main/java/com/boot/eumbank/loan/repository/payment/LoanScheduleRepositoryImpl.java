package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.entity.QLoanSchedule;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository @RequiredArgsConstructor
public class LoanScheduleRepositoryImpl implements LoanScheduleRepositoryCustom{

    //쿼리dsl
    private final JPAQueryFactory queryFactory;
    private final EntityManager manager;
    private static final QLoanSchedule loanSchedule = QLoanSchedule.loanSchedule;

    @Override
    public List<LoanSchedule> findRepayTargets(Long loanNo) {
        return queryFactory.selectFrom(loanSchedule)
                .where(loanSchedule.loanNo.loe(loanNo)
                .and(loanSchedule.status.in("DUE", "PARTIAL", "FAILED", "OVERDUE")))
                .orderBy(loanSchedule.dueDate.asc(),
                        loanSchedule.installmentNo.asc())
                .fetch();
    }

    @Override
    public void lockLoanRow(Long loanNo) {
        // pessimistic_write 락
        manager.find(Loan.class, loanNo, LockModeType.PESSIMISTIC_WRITE);
    }

    /**
     * 당일 바로 출금 대상
     * @param dueDate
     * @return
     */
    @Override
    public List<LoanSchedule> findAllDueForAutoDebit(LocalDate dueDate) {
        return queryFactory.selectFrom(loanSchedule)
                .where(
                        loanSchedule.dueDate.loe(dueDate),
                        loanSchedule.status.in("DUE", "PARTIAL", "FAILED", "OVERDUE"),
                        hasRemaining()
                )
                .orderBy(loanSchedule.installmentNo.asc())
                .fetch();
    }

    /**
     * 재시도 대상
     * @param forDate
     * @return
     */
    @Override
    public List<LoanSchedule> findNeedRetry(LocalDate forDate) {
        return queryFactory.selectFrom(loanSchedule)
                .where(
                        loanSchedule.dueDate.loe(forDate),
                        loanSchedule.status.in("DUE", "PARTIAL", "FAILED", "OVERDUE"),
                        hasRemaining()
                )
                .orderBy(loanSchedule.installmentNo.asc())
                .fetch();
    }

    /**
     * 연체 판정 대상
     * --> 납기일이 현재보다 과거,
     *      상태가 DUE나 PARTIAL이고
     *          잔액이 남아있는 경우
     * @param asOfDate
     * @return
     */
    @Override
    public List<LoanSchedule> findOverdueTargets(LocalDate asOfDate) {
        return queryFactory.selectFrom(loanSchedule)
                .where(
                        loanSchedule.dueDate.before(asOfDate),
                        loanSchedule.status.in("DUE", "PARTIAL", "FAILED", "OVERDUE"),
                        hasRemaining()
                )
                .orderBy(loanSchedule.dueDate.asc(), loanSchedule.installmentNo.asc())
                .fetch();
    }

    /**
     * 남은 금액=
     * due_total - paid_principal - paid_interest) > 0
     */
    private static BooleanExpression hasRemaining() {
        return loanSchedule.dueTotal.subtract(loanSchedule.paidPrincipal.add(loanSchedule.paidInterest))
                .gt(BigDecimal.ZERO);
    }
}
