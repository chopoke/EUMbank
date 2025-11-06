package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPoTransferHistory is a Querydsl query type for PoTransferHistory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPoTransferHistory extends EntityPathBase<PoTransferHistory> {

    private static final long serialVersionUID = -1943382717L;

    public static final QPoTransferHistory poTransferHistory = new QPoTransferHistory("poTransferHistory");

    public final NumberPath<Long> aNo = createNumber("aNo", Long.class);

    public final StringPath thAccountIn = createString("thAccountIn");

    public final StringPath thAccountOut = createString("thAccountOut");

    public final NumberPath<Long> thAfterBalance = createNumber("thAfterBalance", Long.class);

    public final NumberPath<Long> thAmount = createNumber("thAmount", Long.class);

    public final StringPath thMemo = createString("thMemo");

    public final StringPath thOtherAccount = createString("thOtherAccount");

    public final StringPath thOtherBank = createString("thOtherBank");

    public final StringPath thTransactionType = createString("thTransactionType");

    public final DateTimePath<java.time.LocalDateTime> thTransferAt = createDateTime("thTransferAt", java.time.LocalDateTime.class);

    public final StringPath thTransferId = createString("thTransferId");

    public final NumberPath<Long> thTransferNo = createNumber("thTransferNo", Long.class);

    public final StringPath thTransferType = createString("thTransferType");

    public QPoTransferHistory(String variable) {
        super(PoTransferHistory.class, forVariable(variable));
    }

    public QPoTransferHistory(Path<? extends PoTransferHistory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPoTransferHistory(PathMetadata metadata) {
        super(PoTransferHistory.class, metadata);
    }

}

