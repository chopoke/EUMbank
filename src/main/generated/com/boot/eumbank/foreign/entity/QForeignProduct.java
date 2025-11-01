package com.boot.eumbank.foreign.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QForeignProduct is a Querydsl query type for ForeignProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QForeignProduct extends EntityPathBase<ForeignProduct> {

    private static final long serialVersionUID = -813761464L;

    public static final QForeignProduct foreignProduct = new QForeignProduct("foreignProduct");

    public final NumberPath<java.math.BigDecimal> apy = createNumber("apy", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> bkpr = createNumber("bkpr", java.math.BigDecimal.class);

    public final StringPath curNm = createString("curNm");

    public final StringPath curUnit = createString("curUnit");

    public final NumberPath<java.math.BigDecimal> dealBasR = createNumber("dealBasR", java.math.BigDecimal.class);

    public final StringPath dpProtectYn = createString("dpProtectYn");

    public final NumberPath<Integer> id = createNumber("id", Integer.class);

    public final StringPath ioYn = createString("ioYn");

    public final NumberPath<java.math.BigDecimal> kftcBkpr = createNumber("kftcBkpr", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> kftcDealBasR = createNumber("kftcDealBasR", java.math.BigDecimal.class);

    public final StringPath prodType = createString("prodType");

    public final NumberPath<java.math.BigDecimal> tenDdEfeeR = createNumber("tenDdEfeeR", java.math.BigDecimal.class);

    public final NumberPath<Integer> termMon = createNumber("termMon", Integer.class);

    public final NumberPath<java.math.BigDecimal> ttb = createNumber("ttb", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> tts = createNumber("tts", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> yyEfeeR = createNumber("yyEfeeR", java.math.BigDecimal.class);

    public QForeignProduct(String variable) {
        super(ForeignProduct.class, forVariable(variable));
    }

    public QForeignProduct(Path<? extends ForeignProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QForeignProduct(PathMetadata metadata) {
        super(ForeignProduct.class, metadata);
    }

}

