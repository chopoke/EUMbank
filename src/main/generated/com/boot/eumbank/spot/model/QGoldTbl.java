package com.boot.eumbank.spot.model;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QGoldTbl is a Querydsl query type for GoldTbl
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGoldTbl extends EntityPathBase<GoldTbl> {

    private static final long serialVersionUID = -1117900783L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QGoldTbl goldTbl = new QGoldTbl("goldTbl");

    public final com.boot.eumbank.customer.entity.QCustomer customer;

    public final NumberPath<java.math.BigDecimal> gFeeAmount = createNumber("gFeeAmount", java.math.BigDecimal.class);

    public final StringPath gId = createString("gId");

    public final NumberPath<Integer> gNo = createNumber("gNo", Integer.class);

    public final QGoldProduct goldProduct;

    public final NumberPath<java.math.BigDecimal> gPricePerG = createNumber("gPricePerG", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> gPurchasedAt = createDateTime("gPurchasedAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> gQuantity = createNumber("gQuantity", java.math.BigDecimal.class);

    public final EnumPath<GoldTbl.TransactionStatus> gStatus = createEnum("gStatus", GoldTbl.TransactionStatus.class);

    public final NumberPath<java.math.BigDecimal> gTaxAmount = createNumber("gTaxAmount", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gTotalPrice = createNumber("gTotalPrice", java.math.BigDecimal.class);

    public final EnumPath<GoldTbl.TransactionType> gTransactionType = createEnum("gTransactionType", GoldTbl.TransactionType.class);

    public final StringPath gWalletName = createString("gWalletName");

    public QGoldTbl(String variable) {
        this(GoldTbl.class, forVariable(variable), INITS);
    }

    public QGoldTbl(Path<? extends GoldTbl> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QGoldTbl(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QGoldTbl(PathMetadata metadata, PathInits inits) {
        this(GoldTbl.class, metadata, inits);
    }

    public QGoldTbl(Class<? extends GoldTbl> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.customer = inits.isInitialized("customer") ? new com.boot.eumbank.customer.entity.QCustomer(forProperty("customer")) : null;
        this.goldProduct = inits.isInitialized("goldProduct") ? new QGoldProduct(forProperty("goldProduct")) : null;
    }

}

