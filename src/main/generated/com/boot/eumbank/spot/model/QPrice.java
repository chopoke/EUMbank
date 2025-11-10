package com.boot.eumbank.spot.model;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPrice is a Querydsl query type for Price
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPrice extends EntityPathBase<Price> {

    private static final long serialVersionUID = -1999466788L;

    public static final QPrice price = new QPrice("price");

    public final NumberPath<java.math.BigDecimal> pBasePrice = createNumber("pBasePrice", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> pBuyPrice = createNumber("pBuyPrice", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> pCreatedAt = createDateTime("pCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> pFluctuationRate = createNumber("pFluctuationRate", java.math.BigDecimal.class);

    public final StringPath pMetalCode = createString("pMetalCode");

    public final NumberPath<Integer> pNo = createNumber("pNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> pSellPrice = createNumber("pSellPrice", java.math.BigDecimal.class);

    public QPrice(String variable) {
        super(Price.class, forVariable(variable));
    }

    public QPrice(Path<? extends Price> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPrice(PathMetadata metadata) {
        super(Price.class, metadata);
    }

}

