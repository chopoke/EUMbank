package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBillInvoice is a Querydsl query type for BillInvoice
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBillInvoice extends EntityPathBase<BillInvoice> {

    private static final long serialVersionUID = 1699787934L;

    public static final QBillInvoice billInvoice = new QBillInvoice("billInvoice");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> biAmount = createNumber("biAmount", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> biCreatedAt = createDateTime("biCreatedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> biDueAt = createDateTime("biDueAt", java.time.LocalDateTime.class);

    public final StringPath biId = createString("biId");

    public final NumberPath<Integer> biMonth = createNumber("biMonth", Integer.class);

    public final NumberPath<Integer> biNo = createNumber("biNo", Integer.class);

    public final StringPath biStatus = createString("biStatus");

    public final NumberPath<java.math.BigDecimal> biUsage = createNumber("biUsage", java.math.BigDecimal.class);

    public final NumberPath<Integer> biYear = createNumber("biYear", Integer.class);

    public final NumberPath<Integer> ubNo = createNumber("ubNo", Integer.class);

    public QBillInvoice(String variable) {
        super(BillInvoice.class, forVariable(variable));
    }

    public QBillInvoice(Path<? extends BillInvoice> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBillInvoice(PathMetadata metadata) {
        super(BillInvoice.class, metadata);
    }

}

