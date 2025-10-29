package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProductForeignList is a Querydsl query type for ProductForeignList
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProductForeignList extends EntityPathBase<ProductForeignList> {

    private static final long serialVersionUID = -691008726L;

    public static final QProductForeignList productForeignList = new QProductForeignList("productForeignList");

    public final NumberPath<java.math.BigDecimal> apy = createNumber("apy", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> bkpr = createNumber("bkpr", java.math.BigDecimal.class);

    public final StringPath curNm = createString("curNm");

    public final StringPath curUnit = createString("curUnit");

    public final NumberPath<java.math.BigDecimal> dealBasR = createNumber("dealBasR", java.math.BigDecimal.class);

    public final StringPath dpProtectYn = createString("dpProtectYn");

    public final StringPath fpButtonText = createString("fpButtonText");

    public final StringPath fpCode = createString("fpCode");

    public final StringPath fpDescription = createString("fpDescription");

    public final StringPath fpFeature = createString("fpFeature");

    public final StringPath fpHref = createString("fpHref");

    public final StringPath fpName = createString("fpName");

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

    public QProductForeignList(String variable) {
        super(ProductForeignList.class, forVariable(variable));
    }

    public QProductForeignList(Path<? extends ProductForeignList> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProductForeignList(PathMetadata metadata) {
        super(ProductForeignList.class, metadata);
    }

}

