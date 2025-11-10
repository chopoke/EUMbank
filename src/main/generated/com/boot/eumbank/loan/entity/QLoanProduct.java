package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanProduct is a Querydsl query type for LoanProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanProduct extends EntityPathBase<LoanProduct> {

    private static final long serialVersionUID = 725938638L;

    public static final QLoanProduct loanProduct = new QLoanProduct("loanProduct");

    public final StringPath bankName = createString("bankName");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath dclsEndDay = createString("dclsEndDay");

    public final StringPath dclsMonth = createString("dclsMonth");

    public final StringPath dclsStartDay = createString("dclsStartDay");

    public final StringPath dlyRate = createString("dlyRate");

    public final StringPath erlyRpayFee = createString("erlyRpayFee");

    public final StringPath finCoNo = createString("finCoNo");

    public final StringPath finCoSubmDay = createString("finCoSubmDay");

    public final BooleanPath isActive = createBoolean("isActive");

    public final StringPath joinWay = createString("joinWay");

    public final NumberPath<java.math.BigDecimal> limitMax = createNumber("limitMax", java.math.BigDecimal.class);

    public final StringPath loanCode = createString("loanCode");

    public final StringPath loanInciExpn = createString("loanInciExpn");

    public final StringPath loanLmtRaw = createString("loanLmtRaw");

    public final StringPath loanName = createString("loanName");

    public final NumberPath<Long> loanNo = createNumber("loanNo", Long.class);

    public final StringPath loanType = createString("loanType");

    public final NumberPath<Integer> ltvMax = createNumber("ltvMax", Integer.class);

    public final NumberPath<java.math.BigDecimal> rateMax = createNumber("rateMax", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> rateMin = createNumber("rateMin", java.math.BigDecimal.class);

    public final StringPath sourceType = createString("sourceType");

    public final StringPath status = createString("status");

    public final StringPath summary = createString("summary");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QLoanProduct(String variable) {
        super(LoanProduct.class, forVariable(variable));
    }

    public QLoanProduct(Path<? extends LoanProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanProduct(PathMetadata metadata) {
        super(LoanProduct.class, metadata);
    }

}

