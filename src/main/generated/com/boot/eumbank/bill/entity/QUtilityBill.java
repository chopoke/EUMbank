package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QUtilityBill is a Querydsl query type for UtilityBill
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUtilityBill extends EntityPathBase<UtilityBill> {

    private static final long serialVersionUID = -608250101L;

    public static final QUtilityBill utilityBill = new QUtilityBill("utilityBill");

    public final StringPath bpCode = createString("bpCode");

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final StringPath ubAddr = createString("ubAddr");

    public final DateTimePath<java.time.LocalDateTime> ubCreatedAt = createDateTime("ubCreatedAt", java.time.LocalDateTime.class);

    public final StringPath ubHolder = createString("ubHolder");

    public final StringPath ubId = createString("ubId");

    public final StringPath ubMeterNo = createString("ubMeterNo");

    public final NumberPath<Integer> ubNo = createNumber("ubNo", Integer.class);

    public final StringPath ubStatus = createString("ubStatus");

    public final DateTimePath<java.time.LocalDateTime> ubUpdatedAt = createDateTime("ubUpdatedAt", java.time.LocalDateTime.class);

    public QUtilityBill(String variable) {
        super(UtilityBill.class, forVariable(variable));
    }

    public QUtilityBill(Path<? extends UtilityBill> path) {
        super(path.getType(), path.getMetadata());
    }

    public QUtilityBill(PathMetadata metadata) {
        super(UtilityBill.class, metadata);
    }

}

