package com.boot.eumbank.account.open.entity.account;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAForeignProduct is a Querydsl query type for AForeignProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAForeignProduct extends EntityPathBase<AForeignProduct> {

    private static final long serialVersionUID = -175117297L;

    public static final QAForeignProduct aForeignProduct = new QAForeignProduct("aForeignProduct");

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

    public QAForeignProduct(String variable) {
        super(AForeignProduct.class, forVariable(variable));
    }

    public QAForeignProduct(Path<? extends AForeignProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAForeignProduct(PathMetadata metadata) {
        super(AForeignProduct.class, metadata);
    }

}

