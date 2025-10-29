package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QLoanProductOption is a Querydsl query type for LoanProductOption
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanProductOption extends EntityPathBase<LoanProductOption> {

    private static final long serialVersionUID = -2072030237L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QLoanProductOption loanProductOption = new QLoanProductOption("loanProductOption");

    public final StringPath dclsMonth = createString("dclsMonth");

    public final NumberPath<Integer> id = createNumber("id", Integer.class);

    public final StringPath isOverdraft = createString("isOverdraft");

    public final NumberPath<java.math.BigDecimal> lendRateAvg = createNumber("lendRateAvg", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> lendRateMax = createNumber("lendRateMax", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> lendRateMin = createNumber("lendRateMin", java.math.BigDecimal.class);

    public final StringPath lendRateTypeNm = createString("lendRateTypeNm");

    public final StringPath note = createString("note");

    public final QLoanProduct product;

    public final StringPath rpayTypeNm = createString("rpayTypeNm");

    public final NumberPath<Integer> termMonth = createNumber("termMonth", Integer.class);

    public QLoanProductOption(String variable) {
        this(LoanProductOption.class, forVariable(variable), INITS);
    }

    public QLoanProductOption(Path<? extends LoanProductOption> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QLoanProductOption(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QLoanProductOption(PathMetadata metadata, PathInits inits) {
        this(LoanProductOption.class, metadata, inits);
    }

    public QLoanProductOption(Class<? extends LoanProductOption> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.product = inits.isInitialized("product") ? new QLoanProduct(forProperty("product")) : null;
    }

}

