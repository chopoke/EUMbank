package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanDelinquency is a Querydsl query type for LoanDelinquency
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanDelinquency extends EntityPathBase<LoanDelinquency> {

    private static final long serialVersionUID = -961105198L;

    public static final QLoanDelinquency loanDelinquency = new QLoanDelinquency("loanDelinquency");

    public final DateTimePath<java.time.LocalDateTime> calcDate = createDateTime("calcDate", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> capRate = createNumber("capRate", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> delAmount = createNumber("delAmount", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> delRate = createNumber("delRate", java.math.BigDecimal.class);

    public final StringPath ldId = createString("ldId");

    public final NumberPath<Long> ldNo = createNumber("ldNo", Long.class);

    public final NumberPath<Long> loanNo = createNumber("loanNo", Long.class);

    public final StringPath memo = createString("memo");

    public final NumberPath<java.math.BigDecimal> overdueAmt = createNumber("overdueAmt", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> penMargin = createNumber("penMargin", java.math.BigDecimal.class);

    public final NumberPath<Long> scheduleId = createNumber("scheduleId", Long.class);

    public final StringPath waivedYn = createString("waivedYn");

    public QLoanDelinquency(String variable) {
        super(LoanDelinquency.class, forVariable(variable));
    }

    public QLoanDelinquency(Path<? extends LoanDelinquency> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanDelinquency(PathMetadata metadata) {
        super(LoanDelinquency.class, metadata);
    }

}

