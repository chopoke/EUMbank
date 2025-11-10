package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanSchedule is a Querydsl query type for LoanSchedule
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanSchedule extends EntityPathBase<LoanSchedule> {

    private static final long serialVersionUID = 1335101848L;

    public static final QLoanSchedule loanSchedule = new QLoanSchedule("loanSchedule");

    public final DatePath<java.time.LocalDate> dueDate = createDate("dueDate", java.time.LocalDate.class);

    public final NumberPath<java.math.BigDecimal> dueInterest = createNumber("dueInterest", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> duePrincipal = createNumber("duePrincipal", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> dueTotal = createNumber("dueTotal", java.math.BigDecimal.class);

    public final NumberPath<Integer> installmentNo = createNumber("installmentNo", Integer.class);

    public final NumberPath<Long> loanNo = createNumber("loanNo", Long.class);

    public final NumberPath<Long> lsNo = createNumber("lsNo", Long.class);

    public final NumberPath<java.math.BigDecimal> paidInterest = createNumber("paidInterest", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> paidPrincipal = createNumber("paidPrincipal", java.math.BigDecimal.class);

    public final StringPath status = createString("status");

    public QLoanSchedule(String variable) {
        super(LoanSchedule.class, forVariable(variable));
    }

    public QLoanSchedule(Path<? extends LoanSchedule> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanSchedule(PathMetadata metadata) {
        super(LoanSchedule.class, metadata);
    }

}

