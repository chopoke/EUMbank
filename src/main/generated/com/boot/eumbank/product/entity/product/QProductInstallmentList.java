package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProductInstallmentList is a Querydsl query type for ProductInstallmentList
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProductInstallmentList extends EntityPathBase<ProductInstallmentList> {

    private static final long serialVersionUID = -1752360625L;

    public static final QProductInstallmentList productInstallmentList = new QProductInstallmentList("productInstallmentList");

    public final StringPath ipButtonText = createString("ipButtonText");

    public final StringPath ipCode = createString("ipCode");

    public final DateTimePath<java.time.LocalDateTime> ipCreatedAt = createDateTime("ipCreatedAt", java.time.LocalDateTime.class);

    public final StringPath ipDescription = createString("ipDescription");

    public final NumberPath<java.math.BigDecimal> ipEarlyTerminationRate = createNumber("ipEarlyTerminationRate", java.math.BigDecimal.class);

    public final StringPath ipFeature = createString("ipFeature");

    public final StringPath ipHref = createString("ipHref");

    public final StringPath ipInterestPaymentType = createString("ipInterestPaymentType");

    public final StringPath ipIsActive = createString("ipIsActive");

    public final NumberPath<java.math.BigDecimal> ipMaxMonthlyAmount = createNumber("ipMaxMonthlyAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> ipMaxMonths = createNumber("ipMaxMonths", Integer.class);

    public final NumberPath<java.math.BigDecimal> ipMinMonthlyAmount = createNumber("ipMinMonthlyAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> ipMinMonths = createNumber("ipMinMonths", Integer.class);

    public final StringPath ipName = createString("ipName");

    public final NumberPath<Integer> ipNo = createNumber("ipNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> ipRate = createNumber("ipRate", java.math.BigDecimal.class);

    public final StringPath ipType = createString("ipType");

    public final DateTimePath<java.time.LocalDateTime> ipUpdatedAt = createDateTime("ipUpdatedAt", java.time.LocalDateTime.class);

    public QProductInstallmentList(String variable) {
        super(ProductInstallmentList.class, forVariable(variable));
    }

    public QProductInstallmentList(Path<? extends ProductInstallmentList> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProductInstallmentList(PathMetadata metadata) {
        super(ProductInstallmentList.class, metadata);
    }

}

