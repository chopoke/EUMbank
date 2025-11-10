package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoan is a Querydsl query type for Loan
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoan extends EntityPathBase<Loan> {

    private static final long serialVersionUID = -2141158431L;

    public static final QLoan loan = new QLoan("loan");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> balance = createNumber("balance", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> closedAt = createDateTime("closedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath currency = createString("currency");

    public final NumberPath<java.math.BigDecimal> interestRate = createNumber("interestRate", java.math.BigDecimal.class);

    public final NumberPath<Long> laNo = createNumber("laNo", Long.class);

    public final DateTimePath<java.time.LocalDateTime> lastPaidAt = createDateTime("lastPaidAt", java.time.LocalDateTime.class);

    public final StringPath lId = createString("lId");

    public final NumberPath<Long> lNo = createNumber("lNo", Long.class);

    public final NumberPath<Long> lpdNo = createNumber("lpdNo", Long.class);

    public final DateTimePath<java.time.LocalDateTime> maturityDate = createDateTime("maturityDate", java.time.LocalDateTime.class);

    public final NumberPath<Integer> payDay = createNumber("payDay", Integer.class);

    public final NumberPath<java.math.BigDecimal> principalAmount = createNumber("principalAmount", java.math.BigDecimal.class);

    public final StringPath rateType = createString("rateType");

    public final NumberPath<Integer> repayAccount = createNumber("repayAccount", Integer.class);

    public final StringPath repayMethod = createString("repayMethod");

    public final NumberPath<java.math.BigDecimal> spreadRate = createNumber("spreadRate", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> startDate = createDateTime("startDate", java.time.LocalDateTime.class);

    public final StringPath status = createString("status");

    public final NumberPath<Integer> termMonth = createNumber("termMonth", Integer.class);

    public QLoan(String variable) {
        super(Loan.class, forVariable(variable));
    }

    public QLoan(Path<? extends Loan> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoan(PathMetadata metadata) {
        super(Loan.class, metadata);
    }

}

