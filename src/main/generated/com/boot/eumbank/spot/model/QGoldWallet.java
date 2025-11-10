package com.boot.eumbank.spot.model;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QGoldWallet is a Querydsl query type for GoldWallet
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGoldWallet extends EntityPathBase<GoldWallet> {

    private static final long serialVersionUID = -120742202L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QGoldWallet goldWallet = new QGoldWallet("goldWallet");

    public final com.boot.eumbank.customer.entity.QCustomer customer;

    public final StringPath gwAccountNo = createString("gwAccountNo");

    public final StringPath gwActiveYn = createString("gwActiveYn");

    public final NumberPath<java.math.BigDecimal> gwCashBalance = createNumber("gwCashBalance", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> gwCreatedAt = createDateTime("gwCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> gwGoldBalance = createNumber("gwGoldBalance", java.math.BigDecimal.class);

    public final NumberPath<Integer> gwNo = createNumber("gwNo", Integer.class);

    public final StringPath gwPin = createString("gwPin");

    public final NumberPath<java.math.BigDecimal> gwSilverBalance = createNumber("gwSilverBalance", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gwTotalBalance = createNumber("gwTotalBalance", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> gwUpdatedAt = createDateTime("gwUpdatedAt", java.time.LocalDateTime.class);

    public final StringPath gwWalletName = createString("gwWalletName");

    public QGoldWallet(String variable) {
        this(GoldWallet.class, forVariable(variable), INITS);
    }

    public QGoldWallet(Path<? extends GoldWallet> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QGoldWallet(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QGoldWallet(PathMetadata metadata, PathInits inits) {
        this(GoldWallet.class, metadata, inits);
    }

    public QGoldWallet(Class<? extends GoldWallet> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.customer = inits.isInitialized("customer") ? new com.boot.eumbank.customer.entity.QCustomer(forProperty("customer")) : null;
    }

}

