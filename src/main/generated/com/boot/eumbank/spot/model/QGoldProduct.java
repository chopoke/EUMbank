package com.boot.eumbank.spot.model;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QGoldProduct is a Querydsl query type for GoldProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGoldProduct extends EntityPathBase<GoldProduct> {

    private static final long serialVersionUID = -876356670L;

    public static final QGoldProduct goldProduct = new QGoldProduct("goldProduct");

    public final StringPath gpActiveYn = createString("gpActiveYn");

    public final DateTimePath<java.time.LocalDateTime> gpCreatedAt = createDateTime("gpCreatedAt", java.time.LocalDateTime.class);

    public final StringPath gpId = createString("gpId");

    public final StringPath gpMetalCode = createString("gpMetalCode");

    public final StringPath gpName = createString("gpName");

    public final NumberPath<Integer> gpNo = createNumber("gpNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> gpPremiumPerG = createNumber("gpPremiumPerG", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gpPurity = createNumber("gpPurity", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> gpWeightG = createNumber("gpWeightG", java.math.BigDecimal.class);

    public QGoldProduct(String variable) {
        super(GoldProduct.class, forVariable(variable));
    }

    public QGoldProduct(Path<? extends GoldProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QGoldProduct(PathMetadata metadata) {
        super(GoldProduct.class, metadata);
    }

}

