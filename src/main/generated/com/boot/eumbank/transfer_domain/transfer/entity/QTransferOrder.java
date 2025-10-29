package com.boot.eumbank.transfer_domain.transfer.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTransferOrder is a Querydsl query type for TransferOrder
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTransferOrder extends EntityPathBase<TransferOrder> {

    private static final long serialVersionUID = -198523807L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTransferOrder transferOrder = new QTransferOrder("transferOrder");

    public final NumberPath<Integer> a_no = createNumber("a_no", Integer.class);

    public final com.boot.eumbank.account.open.entity.account.QAccount account;

    public final NumberPath<java.math.BigDecimal> to_amount = createNumber("to_amount", java.math.BigDecimal.class);

    public final StringPath to_bank_code = createString("to_bank_code");

    public final DateTimePath<java.time.LocalDateTime> to_created_at = createDateTime("to_created_at", java.time.LocalDateTime.class);

    public final StringPath to_dest_account_no = createString("to_dest_account_no");

    public final DateTimePath<java.time.LocalDateTime> to_end_at = createDateTime("to_end_at", java.time.LocalDateTime.class);

    public final StringPath to_memo = createString("to_memo");

    public final NumberPath<Integer> to_order_id = createNumber("to_order_id", Integer.class);

    public final StringPath to_schedule_expr = createString("to_schedule_expr");

    public final StringPath to_schedule_type = createString("to_schedule_type");

    public final DateTimePath<java.time.LocalDateTime> to_start_at = createDateTime("to_start_at", java.time.LocalDateTime.class);

    public final StringPath to_status = createString("to_status");

    public QTransferOrder(String variable) {
        this(TransferOrder.class, forVariable(variable), INITS);
    }

    public QTransferOrder(Path<? extends TransferOrder> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTransferOrder(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTransferOrder(PathMetadata metadata, PathInits inits) {
        this(TransferOrder.class, metadata, inits);
    }

    public QTransferOrder(Class<? extends TransferOrder> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.account = inits.isInitialized("account") ? new com.boot.eumbank.account.open.entity.account.QAccount(forProperty("account")) : null;
    }

}

