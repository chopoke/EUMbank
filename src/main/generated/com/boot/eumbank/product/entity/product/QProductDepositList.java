package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProductDepositList is a Querydsl query type for ProductDepositList
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProductDepositList extends EntityPathBase<ProductDepositList> {

    private static final long serialVersionUID = 489139188L;

    public static final QProductDepositList productDepositList = new QProductDepositList("productDepositList");

    public final StringPath dpButtonText = createString("dpButtonText");

    public final StringPath dpCode = createString("dpCode");

    public final DateTimePath<java.time.LocalDateTime> dpCreatedAt = createDateTime("dpCreatedAt", java.time.LocalDateTime.class);

    public final StringPath dpDescription = createString("dpDescription");

    public final NumberPath<java.math.BigDecimal> dpEarlyTerminationRate = createNumber("dpEarlyTerminationRate", java.math.BigDecimal.class);

    public final StringPath dpFeature = createString("dpFeature");

    public final StringPath dpHref = createString("dpHref");

    public final StringPath dpInterestPaymentType = createString("dpInterestPaymentType");

    public final StringPath dpIsActive = createString("dpIsActive");

    public final NumberPath<java.math.BigDecimal> dpMaxAmount = createNumber("dpMaxAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> dpMaxMonths = createNumber("dpMaxMonths", Integer.class);

    public final NumberPath<java.math.BigDecimal> dpMinAmount = createNumber("dpMinAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> dpMinMonths = createNumber("dpMinMonths", Integer.class);

    public final StringPath dpName = createString("dpName");

    public final NumberPath<Integer> dpNo = createNumber("dpNo", Integer.class);

    public final StringPath dpRate = createString("dpRate");

    public final StringPath dpType = createString("dpType");

    public final DateTimePath<java.time.LocalDateTime> dpUpdatedAt = createDateTime("dpUpdatedAt", java.time.LocalDateTime.class);

    public QProductDepositList(String variable) {
        super(ProductDepositList.class, forVariable(variable));
    }

    public QProductDepositList(Path<? extends ProductDepositList> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProductDepositList(PathMetadata metadata) {
        super(ProductDepositList.class, metadata);
    }

}

