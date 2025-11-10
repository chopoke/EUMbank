package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QWaterRate is a Querydsl query type for WaterRate
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWaterRate extends EntityPathBase<WaterRate> {

    private static final long serialVersionUID = -1130503153L;

    public static final QWaterRate waterRate = new QWaterRate("waterRate");

    public final NumberPath<java.math.BigDecimal> wrBaseCharge = createNumber("wrBaseCharge", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> wrEffFrom = createDateTime("wrEffFrom", java.time.LocalDateTime.class);

    public final NumberPath<Integer> wrId = createNumber("wrId", Integer.class);

    public final NumberPath<java.math.BigDecimal> wrUnitPrice = createNumber("wrUnitPrice", java.math.BigDecimal.class);

    public QWaterRate(String variable) {
        super(WaterRate.class, forVariable(variable));
    }

    public QWaterRate(Path<? extends WaterRate> path) {
        super(path.getType(), path.getMetadata());
    }

    public QWaterRate(PathMetadata metadata) {
        super(WaterRate.class, metadata);
    }

}

