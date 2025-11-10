package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanApplication is a Querydsl query type for LoanApplication
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanApplication extends EntityPathBase<LoanApplication> {

    private static final long serialVersionUID = -294673745L;

    public static final QLoanApplication loanApplication = new QLoanApplication("loanApplication");

    public final NumberPath<java.math.BigDecimal> appliedAmount = createNumber("appliedAmount", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> approvedAmount = createNumber("approvedAmount", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> approvedRate = createNumber("approvedRate", java.math.BigDecimal.class);

    public final NumberPath<Integer> approvedTerm = createNumber("approvedTerm", Integer.class);

    public final StringPath channel = createString("channel");

    public final StringPath contextJson = createString("contextJson");

    public final NumberPath<Integer> customerNo = createNumber("customerNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> decidedAt = createDateTime("decidedAt", java.time.LocalDateTime.class);

    public final StringPath decisionReason = createString("decisionReason");

    public final NumberPath<Integer> desiredTerm = createNumber("desiredTerm", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> fundedAt = createDateTime("fundedAt", java.time.LocalDateTime.class);

    public final StringPath laId = createString("laId");

    public final NumberPath<Long> laNo = createNumber("laNo", Long.class);

    public final NumberPath<Long> loanProductNo = createNumber("loanProductNo", Long.class);

    public final NumberPath<Integer> payoutAccountNo = createNumber("payoutAccountNo", Integer.class);

    public final StringPath purposeCode = createString("purposeCode");

    public final StringPath rateType = createString("rateType");

    public final NumberPath<Integer> repayAccountNo = createNumber("repayAccountNo", Integer.class);

    public final StringPath rpayType = createString("rpayType");

    public final DateTimePath<java.time.LocalDateTime> signedAt = createDateTime("signedAt", java.time.LocalDateTime.class);

    public final StringPath status = createString("status");

    public final DateTimePath<java.time.LocalDateTime> submittedAt = createDateTime("submittedAt", java.time.LocalDateTime.class);

    public QLoanApplication(String variable) {
        super(LoanApplication.class, forVariable(variable));
    }

    public QLoanApplication(Path<? extends LoanApplication> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanApplication(PathMetadata metadata) {
        super(LoanApplication.class, metadata);
    }

}

