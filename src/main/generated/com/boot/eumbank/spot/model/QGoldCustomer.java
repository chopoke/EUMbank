package com.boot.eumbank.spot.model;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QGoldCustomer is a Querydsl query type for GoldCustomer
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGoldCustomer extends EntityPathBase<GoldCustomer> {

    private static final long serialVersionUID = 212683627L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QGoldCustomer goldCustomer = new QGoldCustomer("goldCustomer");

    public final com.boot.eumbank.customer.entity.QCustomer customer;

    public final StringPath gcActiveYn = createString("gcActiveYn");

    public final NumberPath<java.math.BigDecimal> gcCashBalance = createNumber("gcCashBalance", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> gcCreatedAt = createDateTime("gcCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> gcGoldBalance = createNumber("gcGoldBalance", java.math.BigDecimal.class);

    public final NumberPath<Integer> gcNo = createNumber("gcNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> gcSilverBalance = createNumber("gcSilverBalance", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gcTotalInvestment = createNumber("gcTotalInvestment", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gcTotalProfitLoss = createNumber("gcTotalProfitLoss", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> gcUpdatedAt = createDateTime("gcUpdatedAt", java.time.LocalDateTime.class);

    public QGoldCustomer(String variable) {
        this(GoldCustomer.class, forVariable(variable), INITS);
    }

    public QGoldCustomer(Path<? extends GoldCustomer> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QGoldCustomer(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QGoldCustomer(PathMetadata metadata, PathInits inits) {
        this(GoldCustomer.class, metadata, inits);
    }

    public QGoldCustomer(Class<? extends GoldCustomer> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.customer = inits.isInitialized("customer") ? new com.boot.eumbank.customer.entity.QCustomer(forProperty("customer")) : null;
    }

}

