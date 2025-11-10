package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanPayment is a Querydsl query type for LoanPayment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanPayment extends EntityPathBase<LoanPayment> {

    private static final long serialVersionUID = 248731365L;

    public static final QLoanPayment loanPayment = new QLoanPayment("loanPayment");

    public final NumberPath<java.math.BigDecimal> amountReceived = createNumber("amountReceived", java.math.BigDecimal.class);

    public final StringPath idempotencyKey = createString("idempotencyKey");

    public final NumberPath<Integer> installmentNo = createNumber("installmentNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> interestAmt = createNumber("interestAmt", java.math.BigDecimal.class);

    public final NumberPath<Long> loanNo = createNumber("loanNo", Long.class);

    public final StringPath lpId = createString("lpId");

    public final NumberPath<Long> lpNo = createNumber("lpNo", Long.class);

    public final DateTimePath<java.time.LocalDateTime> paymentTime = createDateTime("paymentTime", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> penaltyAmt = createNumber("penaltyAmt", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> principalAmt = createNumber("principalAmt", java.math.BigDecimal.class);

    public final NumberPath<Long> scheduleId = createNumber("scheduleId", Long.class);

    public final StringPath status = createString("status");

    public QLoanPayment(String variable) {
        super(LoanPayment.class, forVariable(variable));
    }

    public QLoanPayment(Path<? extends LoanPayment> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanPayment(PathMetadata metadata) {
        super(LoanPayment.class, metadata);
    }

}

