package com.boot.eumbank.customer.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAuthRefreshToken is a Querydsl query type for AuthRefreshToken
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAuthRefreshToken extends EntityPathBase<AuthRefreshToken> {

    private static final long serialVersionUID = 2110421509L;

    public static final QAuthRefreshToken authRefreshToken = new QAuthRefreshToken("authRefreshToken");

    public final NumberPath<Integer> customerNo = createNumber("customerNo", Integer.class);

    public final DateTimePath<java.time.Instant> deleteAt = createDateTime("deleteAt", java.time.Instant.class);

    public final StringPath deleteReason = createString("deleteReason");

    public final StringPath deviceId = createString("deviceId");

    public final DateTimePath<java.time.Instant> expiresAt = createDateTime("expiresAt", java.time.Instant.class);

    public final DateTimePath<java.time.Instant> issuedAt = createDateTime("issuedAt", java.time.Instant.class);

    public final DateTimePath<java.time.Instant> lastUsedAt = createDateTime("lastUsedAt", java.time.Instant.class);

    public final StringPath lastUsedIp = createString("lastUsedIp");

    public final StringPath rtHash = createString("rtHash");

    public final NumberPath<Long> rtId = createNumber("rtId", Long.class);

    public final StringPath tFrom = createString("tFrom");

    public final StringPath tNext = createString("tNext");

    public final StringPath userAgent = createString("userAgent");

    public QAuthRefreshToken(String variable) {
        super(AuthRefreshToken.class, forVariable(variable));
    }

    public QAuthRefreshToken(Path<? extends AuthRefreshToken> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAuthRefreshToken(PathMetadata metadata) {
        super(AuthRefreshToken.class, metadata);
    }

}

