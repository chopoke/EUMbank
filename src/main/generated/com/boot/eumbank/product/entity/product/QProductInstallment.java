package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QProductInstallment is a Querydsl query type for ProductInstallment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QProductInstallment extends EntityPathBase<ProductInstallment> {

    private static final long serialVersionUID = -1393302255L;

    public static final QProductInstallment productInstallment = new QProductInstallment("productInstallment");

    public final StringPath aAccountNo = createString("aAccountNo");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final StringPath iAccountNo = createString("iAccountNo");

    public final NumberPath<Long> iAmount = createNumber("iAmount", Long.class);

    public final NumberPath<java.math.BigDecimal> iArrearsAmt = createNumber("iArrearsAmt", java.math.BigDecimal.class);

    public final NumberPath<Integer> iArrearsCnt = createNumber("iArrearsCnt", Integer.class);

    public final NumberPath<java.math.BigDecimal> iBonusAmt = createNumber("iBonusAmt", java.math.BigDecimal.class);

    public final NumberPath<Integer> iCountPeriod = createNumber("iCountPeriod", Integer.class);

    public final StringPath iCurrency = createString("iCurrency");

    public final NumberPath<Long> iExpectedMaturityAmount = createNumber("iExpectedMaturityAmount", Long.class);

    public final NumberPath<Integer> iFail = createNumber("iFail", Integer.class);

    public final StringPath iId = createString("iId");

    public final NumberPath<Integer> iInterestAccrued = createNumber("iInterestAccrued", Integer.class);

    public final NumberPath<java.math.BigDecimal> iInterestRate = createNumber("iInterestRate", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> iJoinDate = createDateTime("iJoinDate", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> iMaturityDate = createDateTime("iMaturityDate", java.time.LocalDateTime.class);

    public final NumberPath<Integer> iMonth = createNumber("iMonth", Integer.class);

    public final NumberPath<Integer> iNo = createNumber("iNo", Integer.class);

    public final NumberPath<Integer> iPaidInstallments = createNumber("iPaidInstallments", Integer.class);

    public final StringPath iPayDay = createString("iPayDay");

    public final NumberPath<Integer> ipNo = createNumber("ipNo", Integer.class);

    public final NumberPath<Long> iPrincipalBal = createNumber("iPrincipalBal", Long.class);

    public final NumberPath<Integer> iPrincipalPaid = createNumber("iPrincipalPaid", Integer.class);

    public final StringPath iStatus = createString("iStatus");

    public final DateTimePath<java.time.LocalDateTime> iUpdatedAt = createDateTime("iUpdatedAt", java.time.LocalDateTime.class);

    public QProductInstallment(String variable) {
        super(ProductInstallment.class, forVariable(variable));
    }

    public QProductInstallment(Path<? extends ProductInstallment> path) {
        super(path.getType(), path.getMetadata());
    }

    public QProductInstallment(PathMetadata metadata) {
        super(ProductInstallment.class, metadata);
    }

}

