package com.boot.eumbank.account.select.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTransferHistory is a Querydsl query type for TransferHistory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTransferHistory extends EntityPathBase<TransferHistory> {

    private static final long serialVersionUID = -229377525L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTransferHistory transferHistory = new QTransferHistory("transferHistory");

    public final com.boot.eumbank.account.open.entity.account.QAccount account;

    public final NumberPath<java.math.BigDecimal> accountIn = createNumber("accountIn", java.math.BigDecimal.class);

    public final NumberPath<Integer> accountNo = createNumber("accountNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> accountOut = createNumber("accountOut", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> afterBalance = createNumber("afterBalance", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> amount = createNumber("amount", java.math.BigDecimal.class);

    public final StringPath memo = createString("memo");

    public final StringPath otherAccount = createString("otherAccount");

    public final StringPath otherBank = createString("otherBank");

    public final StringPath transactionType = createString("transactionType");

    public final DateTimePath<java.time.LocalDateTime> transferAt = createDateTime("transferAt", java.time.LocalDateTime.class);

    public final StringPath transferId = createString("transferId");

    public final NumberPath<Integer> transferNo = createNumber("transferNo", Integer.class);

    public final StringPath transferType = createString("transferType");

    public QTransferHistory(String variable) {
        this(TransferHistory.class, forVariable(variable), INITS);
    }

    public QTransferHistory(Path<? extends TransferHistory> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTransferHistory(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTransferHistory(PathMetadata metadata, PathInits inits) {
        this(TransferHistory.class, metadata, inits);
    }

    public QTransferHistory(Class<? extends TransferHistory> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.account = inits.isInitialized("account") ? new com.boot.eumbank.account.open.entity.account.QAccount(forProperty("account")) : null;
    }

}

