package com.boot.eumbank.account.open.entity.account;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QInstallmentProduct is a Querydsl query type for InstallmentProduct
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QInstallmentProduct extends EntityPathBase<InstallmentProduct> {

    private static final long serialVersionUID = -1073758077L;

    public static final QInstallmentProduct installmentProduct = new QInstallmentProduct("installmentProduct");

    public final StringPath ipCode = createString("ipCode");

    public final DateTimePath<java.time.LocalDateTime> ipCreatedAt = createDateTime("ipCreatedAt", java.time.LocalDateTime.class);

    public final StringPath ipDescription = createString("ipDescription");

    public final NumberPath<java.math.BigDecimal> ipEarlyTerminationRate = createNumber("ipEarlyTerminationRate", java.math.BigDecimal.class);

    public final StringPath ipInterestPaymentType = createString("ipInterestPaymentType");

    public final StringPath ipIsActive = createString("ipIsActive");

    public final NumberPath<java.math.BigDecimal> ipMaxMonthlyAmount = createNumber("ipMaxMonthlyAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> ipMaxMonths = createNumber("ipMaxMonths", Integer.class);

    public final NumberPath<java.math.BigDecimal> ipMinMonthlyAmount = createNumber("ipMinMonthlyAmount", java.math.BigDecimal.class);

    public final NumberPath<Integer> ipMinMonths = createNumber("ipMinMonths", Integer.class);

    public final StringPath ipName = createString("ipName");

    public final NumberPath<Integer> ipNo = createNumber("ipNo", Integer.class);

    public final StringPath ipType = createString("ipType");

    public final DateTimePath<java.time.LocalDateTime> ipUpdatedAt = createDateTime("ipUpdatedAt", java.time.LocalDateTime.class);

    public QInstallmentProduct(String variable) {
        super(InstallmentProduct.class, forVariable(variable));
    }

    public QInstallmentProduct(Path<? extends InstallmentProduct> path) {
        super(path.getType(), path.getMetadata());
    }

    public QInstallmentProduct(PathMetadata metadata) {
        super(InstallmentProduct.class, metadata);
    }

}

