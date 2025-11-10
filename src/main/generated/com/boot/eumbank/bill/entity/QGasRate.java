package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QGasRate is a Querydsl query type for GasRate
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGasRate extends EntityPathBase<GasRate> {

    private static final long serialVersionUID = 1345845969L;

    public static final QGasRate gasRate = new QGasRate("gasRate");

    public final NumberPath<java.math.BigDecimal> grBaseCharge = createNumber("grBaseCharge", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> grEffFrom = createDateTime("grEffFrom", java.time.LocalDateTime.class);

    public final NumberPath<Integer> grId = createNumber("grId", Integer.class);

    public final NumberPath<java.math.BigDecimal> grUnitPrice = createNumber("grUnitPrice", java.math.BigDecimal.class);

    public QGasRate(String variable) {
        super(GasRate.class, forVariable(variable));
    }

    public QGasRate(Path<? extends GasRate> path) {
        super(path.getType(), path.getMetadata());
    }

    public QGasRate(PathMetadata metadata) {
        super(GasRate.class, metadata);
    }

}

