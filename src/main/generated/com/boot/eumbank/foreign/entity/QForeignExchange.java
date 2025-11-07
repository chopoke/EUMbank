package com.boot.eumbank.foreign.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QForeignExchange is a Querydsl query type for ForeignExchange
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QForeignExchange extends EntityPathBase<ForeignExchange> {

    private static final long serialVersionUID = -758232598L;

    public static final QForeignExchange foreignExchange = new QForeignExchange("foreignExchange");

    public final StringPath agreeMarketing = createString("agreeMarketing");

    public final StringPath agreePrivacy = createString("agreePrivacy");

    public final StringPath agreeProduct = createString("agreeProduct");

    public final StringPath agreeRisk = createString("agreeRisk");

    public final StringPath agreeTerms = createString("agreeTerms");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> feAmtFc = createNumber("feAmtFc", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> feAmtKrw = createNumber("feAmtKrw", java.math.BigDecimal.class);

    public final StringPath feCurCode = createString("feCurCode");

    public final NumberPath<java.math.BigDecimal> feFee = createNumber("feFee", java.math.BigDecimal.class);

    public final StringPath feId = createString("feId");

    public final StringPath feMemo = createString("feMemo");

    public final NumberPath<Integer> feNo = createNumber("feNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> feOrderedAt = createDateTime("feOrderedAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> feRateApplied = createNumber("feRateApplied", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> feSettledAt = createDateTime("feSettledAt", java.time.LocalDateTime.class);

    public final StringPath feSide = createString("feSide");

    public final StringPath feStatus = createString("feStatus");

    public QForeignExchange(String variable) {
        super(ForeignExchange.class, forVariable(variable));
    }

    public QForeignExchange(Path<? extends ForeignExchange> path) {
        super(path.getType(), path.getMetadata());
    }

    public QForeignExchange(PathMetadata metadata) {
        super(ForeignExchange.class, metadata);
    }

}

