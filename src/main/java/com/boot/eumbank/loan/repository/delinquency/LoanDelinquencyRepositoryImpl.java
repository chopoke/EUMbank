package com.boot.eumbank.loan.repository.delinquency;

import com.boot.eumbank.loan.entity.LoanDelinquency;
import com.boot.eumbank.loan.entity.QLoanDelinquency;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository @RequiredArgsConstructor
public class LoanDelinquencyRepositoryImpl implements LoanDelinquencyRepositoryCustom{

    private final JPAQueryFactory query;
    private final EntityManager em;

    private static final QLoanDelinquency loanDelinquency = QLoanDelinquency.loanDelinquency;

    @Override
    @Transactional
    public long upsertDaily(LoanDelinquency s) {
        // 1) ld_id로 update 먼저 시도
        long updated = query.update(loanDelinquency)
                .set(loanDelinquency.loanNo,       s.getLoanNo())
                .set(loanDelinquency.scheduleId,   s.getScheduleId())
                .set(loanDelinquency.calcDate,     s.getCalcDate())
                .set(loanDelinquency.penMargin,    s.getPenMargin())
                .set(loanDelinquency.delRate,      s.getDelRate())
                .set(loanDelinquency.overdueAmt,   s.getOverdueAmt())
                .set(loanDelinquency.delAmount,    loanDelinquency.delAmount.coalesce(BigDecimal.ZERO).add(s.getDelAmount()))   // 누적
                .set(loanDelinquency.capRate,      s.getCapRate())
                .set(loanDelinquency.waivedYn,     s.getWaivedYn())
                .set(loanDelinquency.memo,         s.getMemo())
                .where(loanDelinquency.ldId.eq(s.getLdId()))
                .execute();

        if (updated == 0) {
            // 2) 없으면 insert
            em.persist(s); // s는 빌더로 완성된 스냅샷 엔티티
            // flush는 트랜잭션 커밋 시점에
            return 1;
        }
        return updated;
    }

    @Override
    public BigDecimal sumDelAmountByLoanUntil(Long loanNo, LocalDateTime until) {
        BigDecimal sum = query.select(loanDelinquency.delAmount.sum())
                .from(loanDelinquency)
                .where(
                        loanDelinquency.loanNo.eq(loanNo),
                        loanDelinquency.calcDate.loe(until) // DATETIME 기준
                )
                .fetchOne();
        return sum == null ? BigDecimal.ZERO : sum.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public Optional<LoanDelinquency> findByLdId(String ldId) {
        LoanDelinquency r = query.selectFrom(loanDelinquency)
                .where(loanDelinquency.ldId.eq(ldId))
                .fetchOne();
        return Optional.ofNullable(r);
    }

    @Override
    public Optional<LoanDelinquency> findByLoanDateAndSchedule(Long loanNo, LocalDateTime calcDate, Long scheduleId) {
        LoanDelinquency r = query.selectFrom(loanDelinquency)
                .where(
                        loanDelinquency.loanNo.eq(loanNo),
                        loanDelinquency.calcDate.eq(calcDate),
                        (scheduleId == null) ? loanDelinquency.scheduleId.isNull() : loanDelinquency.scheduleId.eq(scheduleId)
                )
                .fetchOne();
        return Optional.ofNullable(r);
    }

    @Override
    public BigDecimal sumDelAmountByLoanBetween(Long loanNo, LocalDateTime from, LocalDateTime to) {
        BigDecimal sum = query.select(loanDelinquency.delAmount.sum())
                .from(loanDelinquency)
                .where(
                        loanDelinquency.loanNo.eq(loanNo),
                        loanDelinquency.calcDate.goe(from),
                        loanDelinquency.calcDate.loe(to)
                )
                .fetchOne();
        return sum == null ? BigDecimal.ZERO : sum;
    }

    @Override
    public List<LoanDelinquency> findDailyByLoanBetween(Long loanNo, LocalDateTime from, LocalDateTime to, boolean asc) {
        var q = query.selectFrom(loanDelinquency)
                .where(
                        loanDelinquency.loanNo.eq(loanNo),
                        loanDelinquency.calcDate.goe(from),
                        loanDelinquency.calcDate.loe(to)
                );
        return (asc ? q.orderBy(loanDelinquency.calcDate.asc()) : q.orderBy(loanDelinquency.calcDate.desc()))
                .fetch();
    }
}
