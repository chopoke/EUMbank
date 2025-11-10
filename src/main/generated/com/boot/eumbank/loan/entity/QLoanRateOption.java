package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QLoanRateOption is a Querydsl query type for LoanRateOption
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanRateOption extends EntityPathBase<LoanRateOption> {

    private static final long serialVersionUID = 1482380342L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QLoanRateOption loanRateOption = new QLoanRateOption("loanRateOption");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> lendRateAvg = createNumber("lendRateAvg", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> lendRateMax = createNumber("lendRateMax", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> lendRateMin = createNumber("lendRateMin", java.math.BigDecimal.class);

    public final StringPath lendRateTypeNm = createString("lendRateTypeNm");

    public final NumberPath<Long> lroNo = createNumber("lroNo", Long.class);

    public final StringPath note = createString("note");

    public final QLoanProduct product;

    public final StringPath rpayTypeNm = createString("rpayTypeNm");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QLoanRateOption(String variable) {
        this(LoanRateOption.class, forVariable(variable), INITS);
    }

    public QLoanRateOption(Path<? extends LoanRateOption> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QLoanRateOption(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QLoanRateOption(PathMetadata metadata, PathInits inits) {
        this(LoanRateOption.class, metadata, inits);
    }

    public QLoanRateOption(Class<? extends LoanRateOption> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.product = inits.isInitialized("product") ? new QLoanProduct(forProperty("product")) : null;
    }

}

