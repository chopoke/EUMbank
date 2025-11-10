package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBillPayment is a Querydsl query type for BillPayment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBillPayment extends EntityPathBase<BillPayment> {

    private static final long serialVersionUID = -1047092361L;

    public static final QBillPayment billPayment = new QBillPayment("billPayment");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> biNo = createNumber("biNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> bpAmount = createNumber("bpAmount", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> bpCreatedAt = createDateTime("bpCreatedAt", java.time.LocalDateTime.class);

    public final StringPath bpId = createString("bpId");

    public final NumberPath<Integer> bpNo = createNumber("bpNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> bpPaidAt = createDateTime("bpPaidAt", java.time.LocalDateTime.class);

    public final StringPath bpReceiptNo = createString("bpReceiptNo");

    public final StringPath bpStatus = createString("bpStatus");

    public QBillPayment(String variable) {
        super(BillPayment.class, forVariable(variable));
    }

    public QBillPayment(Path<? extends BillPayment> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBillPayment(PathMetadata metadata) {
        super(BillPayment.class, metadata);
    }

}

