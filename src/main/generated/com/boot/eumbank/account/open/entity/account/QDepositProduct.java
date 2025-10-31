package com.boot.eumbank.account.open.entity.account;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QDepositProduct is a Querydsl query type for DepositProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDepositProduct extends EntityPathBase<DepositProduct> {

    private static final long serialVersionUID = -317740482L;

    public static final QDepositProduct depositProduct = new QDepositProduct("depositProduct");

    public final StringPath dpCode = createString("dpCode");

    public final DateTimePath<java.time.LocalDateTime> dpCreatedAt = createDateTime("dpCreatedAt", java.time.LocalDateTime.class);

    public final StringPath dpDescription = createString("dpDescription");

    public final NumberPath<java.math.BigDecimal> dpEarlyTerminationRate = createNumber("dpEarlyTerminationRate", java.math.BigDecimal.class);

    public final StringPath dpInterestPaymentType = createString("dpInterestPaymentType");

    public final StringPath dpIsActive = createString("dpIsActive");

    public final NumberPath<java.math.BigDecimal> dpMaxAmount = createNumber("dpMaxAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> dpMaxMonths = createNumber("dpMaxMonths", Integer.class);

    public final NumberPath<java.math.BigDecimal> dpMinAmount = createNumber("dpMinAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> dpMinMonths = createNumber("dpMinMonths", Integer.class);

    public final StringPath dpName = createString("dpName");

    public final NumberPath<Integer> dpNo = createNumber("dpNo", Integer.class);

    public final StringPath dpType = createString("dpType");

    public final DateTimePath<java.time.LocalDateTime> dpUpdatedAt = createDateTime("dpUpdatedAt", java.time.LocalDateTime.class);

    public QDepositProduct(String variable) {
        super(DepositProduct.class, forVariable(variable));
    }

    public QDepositProduct(Path<? extends DepositProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QDepositProduct(PathMetadata metadata) {
        super(DepositProduct.class, metadata);
    }

}

