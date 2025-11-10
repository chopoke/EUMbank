package com.boot.eumbank.transfer_domain.account.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAccountLimit is a Querydsl query type for AccountLimit
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAccountLimit extends EntityPathBase<AccountLimit> {

    private static final long serialVersionUID = -1706362594L;

    public static final QAccountLimit accountLimit = new QAccountLimit("accountLimit");

    public final NumberPath<Integer> accountLimitId = createNumber("accountLimitId", Integer.class);

    public final NumberPath<Integer> accountNo = createNumber("accountNo", Integer.class);

    public final NumberPath<java.math.BigDecimal> dailyTransferLimit = createNumber("dailyTransferLimit", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> monthlyTransferLimit = createNumber("monthlyTransferLimit", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> overdraftLimit = createNumber("overdraftLimit", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> perTransferLimit = createNumber("perTransferLimit", java.math.BigDecimal.class);

    public QAccountLimit(String variable) {
        super(AccountLimit.class, forVariable(variable));
    }

    public QAccountLimit(Path<? extends AccountLimit> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAccountLimit(PathMetadata metadata) {
        super(AccountLimit.class, metadata);
    }

}

