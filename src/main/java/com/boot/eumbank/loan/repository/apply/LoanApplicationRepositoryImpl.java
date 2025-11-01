package com.boot.eumbank.loan.repository.apply;

import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.QLoanApplication;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class LoanApplicationRepositoryImpl implements LoanApplicationRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<LoanApplication> search(String laId, Integer customerNo, String status, Pageable pageable) {
        QLoanApplication la = QLoanApplication.loanApplication;

        BooleanBuilder builder = new BooleanBuilder();
        if (laId != null && !laId.isBlank()) {
            builder.and(la.laId.eq(laId));
        }
        if (customerNo != null) {
            builder.and(la.customerNo.eq(customerNo));
        }
        if (status != null && !status.isBlank()) {
            // la.status 가 String 컬럼이면 .eq(status)로 충분
            builder.and(la.status.eq(status));
        }

        List<LoanApplication> rows = queryFactory
                .selectFrom(la)
                .where(builder)
                .orderBy(la.laNo.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(la.count())
                .from(la)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(rows, pageable, total == null ? 0L : total);
    }
}
