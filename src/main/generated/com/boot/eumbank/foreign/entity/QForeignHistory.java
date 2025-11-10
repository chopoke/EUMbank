package com.boot.eumbank.foreign.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QForeignHistory is a Querydsl query type for ForeignHistory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QForeignHistory extends EntityPathBase<ForeignHistory> {

    private static final long serialVersionUID = 422646765L;

    public static final QForeignHistory foreignHistory = new QForeignHistory("foreignHistory");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> fhAmtKrw = createNumber("fhAmtKrw", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> fhCancelledAt = createDateTime("fhCancelledAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> fhCompletedAt = createDateTime("fhCompletedAt", java.time.LocalDateTime.class);

    public final StringPath fhEventType = createString("fhEventType");

    public final StringPath fhExId = createString("fhExId");

    public final NumberPath<java.math.BigDecimal> fhFxAmtFc = createNumber("fhFxAmtFc", java.math.BigDecimal.class);

    public final StringPath fhFxCurCode = createString("fhFxCurCode");

    public final NumberPath<java.math.BigDecimal> fhFxRateApplied = createNumber("fhFxRateApplied", java.math.BigDecimal.class);

    public final NumberPath<Integer> fhNo = createNumber("fhNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> fhOrderedAt = createDateTime("fhOrderedAt", java.time.LocalDateTime.class);

    public final StringPath fhStatus = createString("fhStatus");

    public final StringPath memo = createString("memo");

    public QForeignHistory(String variable) {
        super(ForeignHistory.class, forVariable(variable));
    }

    public QForeignHistory(Path<? extends ForeignHistory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QForeignHistory(PathMetadata metadata) {
        super(ForeignHistory.class, metadata);
    }

}

