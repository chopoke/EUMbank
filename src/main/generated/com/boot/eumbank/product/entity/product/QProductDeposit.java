package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProductDeposit is a Querydsl query type for ProductDeposit
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProductDeposit extends EntityPathBase<ProductDeposit> {

    private static final long serialVersionUID = -635203018L;

    public static final QProductDeposit productDeposit = new QProductDeposit("productDeposit");

    public final StringPath aAccountNo = createString("aAccountNo");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final StringPath dAccountNo = createString("dAccountNo");

    public final NumberPath<java.math.BigDecimal> dAccrInt = createNumber("dAccrInt", java.math.BigDecimal.class);

    public final NumberPath<Long> dAmount = createNumber("dAmount", Long.class);

    public final NumberPath<java.math.BigDecimal> dApy = createNumber("dApy", java.math.BigDecimal.class);

    public final NumberPath<Integer> dCountPeriod = createNumber("dCountPeriod", Integer.class);

    public final StringPath dDormantYn = createString("dDormantYn");

    public final NumberPath<Long> dExpectedMaturityAmount = createNumber("dExpectedMaturityAmount", Long.class);

    public final NumberPath<Integer> dFail = createNumber("dFail", Integer.class);

    public final StringPath dFreezeYn = createString("dFreezeYn");

    public final StringPath dId = createString("dId");

    public final NumberPath<java.math.BigDecimal> dInterestRate = createNumber("dInterestRate", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> dJoinDate = createDateTime("dJoinDate", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> dMaturityDate = createDateTime("dMaturityDate", java.time.LocalDateTime.class);

    public final NumberPath<Integer> dNo = createNumber("dNo", Integer.class);

    public final StringPath dPdfPath = createString("dPdfPath");

    public final NumberPath<Integer> dPeriod = createNumber("dPeriod", Integer.class);

    public final NumberPath<Integer> dpNo = createNumber("dpNo", Integer.class);

    public final NumberPath<Long> dPrincipalBal = createNumber("dPrincipalBal", Long.class);

    public final StringPath dStatus = createString("dStatus");

    public final DateTimePath<java.time.LocalDateTime> dUpdatedAt = createDateTime("dUpdatedAt", java.time.LocalDateTime.class);

    public QProductDeposit(String variable) {
        super(ProductDeposit.class, forVariable(variable));
    }

    public QProductDeposit(Path<? extends ProductDeposit> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProductDeposit(PathMetadata metadata) {
        super(ProductDeposit.class, metadata);
    }

}

