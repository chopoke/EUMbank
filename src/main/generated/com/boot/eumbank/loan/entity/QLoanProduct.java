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

    public final StringPath dclsMonth = createString("dclsMonth");

    public final StringPath description = createString("description");

    public final StringPath etcNote = createString("etcNote");

    public final StringPath finCoNo = createString("finCoNo");

    public final NumberPath<Integer> graceMonth = createNumber("graceMonth", Integer.class);

    public final StringPath joinWay = createString("joinWay");

    public final NumberPath<java.math.BigDecimal> limitMax = createNumber("limitMax", java.math.BigDecimal.class);

    public final StringPath loanCode = createString("loanCode");

    public final StringPath loanLmtRaw = createString("loanLmtRaw");

    public final StringPath loanName = createString("loanName");

    public final NumberPath<Integer> loanNo = createNumber("loanNo", Integer.class);

    public final StringPath loanType = createString("loanType");

    public final NumberPath<Integer> ltvMax = createNumber("ltvMax", Integer.class);

    public final NumberPath<Integer> maxMonth = createNumber("maxMonth", Integer.class);

    public final StringPath policyCode = createString("policyCode");

    public final NumberPath<java.math.BigDecimal> primeRate = createNumber("primeRate", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> rateMax = createNumber("rateMax", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> rateMin = createNumber("rateMin", java.math.BigDecimal.class);

    public final StringPath status = createString("status");

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

