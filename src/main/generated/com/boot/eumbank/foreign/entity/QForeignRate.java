package com.boot.eumbank.foreign.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QForeignRate is a Querydsl query type for ForeignRate
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QForeignRate extends EntityPathBase<ForeignRate> {

    private static final long serialVersionUID = -583728089L;

    public static final QForeignRate foreignRate = new QForeignRate("foreignRate");

    public final StringPath frCurNm = createString("frCurNm");

    public final StringPath frCurUnit = createString("frCurUnit");

    public final NumberPath<java.math.BigDecimal> frDealBas = createNumber("frDealBas", java.math.BigDecimal.class);

    public final NumberPath<Integer> frNo = createNumber("frNo", Integer.class);

    public final DatePath<java.time.LocalDate> frObservedDate = createDate("frObservedDate", java.time.LocalDate.class);

    public final NumberPath<java.math.BigDecimal> frTtb = createNumber("frTtb", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> frTts = createNumber("frTts", java.math.BigDecimal.class);

    public QForeignRate(String variable) {
        super(ForeignRate.class, forVariable(variable));
    }

    public QForeignRate(Path<? extends ForeignRate> path) {
        super(path.getType(), path.getMetadata());
    }

    public QForeignRate(PathMetadata metadata) {
        super(ForeignRate.class, metadata);
    }

}

