package com.boot.eumbank.fcm.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFcmToken is a Querydsl query type for FcmToken
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFcmToken extends EntityPathBase<FcmToken> {

    private static final long serialVersionUID = 1887436178L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFcmToken fcmToken1 = new QFcmToken("fcmToken1");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final com.boot.eumbank.customer.entity.QCustomer customer;

    public final StringPath deviceInfo = createString("deviceInfo");

    public final StringPath fcmToken = createString("fcmToken");

    public final StringPath isSubscribed = createString("isSubscribed");

    public final NumberPath<Long> tokenId = createNumber("tokenId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QFcmToken(String variable) {
        this(FcmToken.class, forVariable(variable), INITS);
    }

    public QFcmToken(Path<? extends FcmToken> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFcmToken(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFcmToken(PathMetadata metadata, PathInits inits) {
        this(FcmToken.class, metadata, inits);
    }

    public QFcmToken(Class<? extends FcmToken> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.customer = inits.isInitialized("customer") ? new com.boot.eumbank.customer.entity.QCustomer(forProperty("customer")) : null;
    }

}

