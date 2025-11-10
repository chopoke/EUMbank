package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBillAutopay is a Querydsl query type for BillAutopay
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBillAutopay extends EntityPathBase<BillAutopay> {

    private static final long serialVersionUID = -906710518L;

    public static final QBillAutopay billAutopay = new QBillAutopay("billAutopay");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final StringPath baActive = createString("baActive");

    public final DateTimePath<java.time.LocalDateTime> baCreatedAt = createDateTime("baCreatedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> baEndedAt = createDateTime("baEndedAt", java.time.LocalDateTime.class);

    public final StringPath baMemo = createString("baMemo");

    public final NumberPath<Integer> baNo = createNumber("baNo", Integer.class);

    public final NumberPath<Integer> baPayDay = createNumber("baPayDay", Integer.class);

    public final StringPath baPayTime = createString("baPayTime");

    public final DateTimePath<java.time.LocalDateTime> baStartedAt = createDateTime("baStartedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> baUpdatedAt = createDateTime("baUpdatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> ubNo = createNumber("ubNo", Integer.class);

    public QBillAutopay(String variable) {
        super(BillAutopay.class, forVariable(variable));
    }

    public QBillAutopay(Path<? extends BillAutopay> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBillAutopay(PathMetadata metadata) {
        super(BillAutopay.class, metadata);
    }

}

