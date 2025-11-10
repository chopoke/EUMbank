package com.boot.eumbank.account.open.entity.account;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAccount is a Querydsl query type for Account
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAccount extends EntityPathBase<Account> {

    private static final long serialVersionUID = -1722819328L;

    public static final QAccount account = new QAccount("account");

    public final StringPath accountNo = createString("accountNo");

    public final StringPath accountPwd = createString("accountPwd");

    public final StringPath accountType = createString("accountType");

    public final StringPath agreeMarketing = createString("agreeMarketing");

    public final StringPath agreePrivacy = createString("agreePrivacy");

    public final StringPath agreeTerms = createString("agreeTerms");

    public final StringPath aId = createString("aId");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> appId = createNumber("appId", Integer.class);

    public final NumberPath<java.math.BigDecimal> balance = createNumber("balance", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> closedAt = createDateTime("closedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final StringPath createdBy = createString("createdBy");

    public final StringPath currency = createString("currency");

    public final DateTimePath<java.time.LocalDateTime> lastTxAt = createDateTime("lastTxAt", java.time.LocalDateTime.class);

    public final StringPath nickname = createString("nickname");

    public final DateTimePath<java.time.LocalDateTime> openedAt = createDateTime("openedAt", java.time.LocalDateTime.class);

    public final StringPath productCode = createString("productCode");

    public final NumberPath<java.math.BigDecimal> rate = createNumber("rate", java.math.BigDecimal.class);

    public final StringPath status = createString("status");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QAccount(String variable) {
        super(Account.class, forVariable(variable));
    }

    public QAccount(Path<? extends Account> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAccount(PathMetadata metadata) {
        super(Account.class, metadata);
    }

}

