package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanApplicationHistory is a Querydsl query type for LoanApplicationHistory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanApplicationHistory extends EntityPathBase<LoanApplicationHistory> {

    private static final long serialVersionUID = -495171867L;

    public static final QLoanApplicationHistory loanApplicationHistory = new QLoanApplicationHistory("loanApplicationHistory");

    public final NumberPath<java.math.BigDecimal> amount = createNumber("amount", java.math.BigDecimal.class);

    public final StringPath bankCode = createString("bankCode");

    public final DateTimePath<java.time.LocalDateTime> disbDate = createDateTime("disbDate", java.time.LocalDateTime.class);

    public final StringPath disbId = createString("disbId");

    public final NumberPath<Long> disbNo = createNumber("disbNo", Long.class);

    public final NumberPath<Long> loanNo = createNumber("loanNo", Long.class);

    public final StringPath memo = createString("memo");

    public final StringPath receiveAccount = createString("receiveAccount");

    public QLoanApplicationHistory(String variable) {
        super(LoanApplicationHistory.class, forVariable(variable));
    }

    public QLoanApplicationHistory(Path<? extends LoanApplicationHistory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanApplicationHistory(PathMetadata metadata) {
        super(LoanApplicationHistory.class, metadata);
    }

}

