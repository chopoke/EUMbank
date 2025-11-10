package com.boot.eumbank.loan.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QLoanConsent is a Querydsl query type for LoanConsent
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLoanConsent extends EntityPathBase<LoanConsent> {

    private static final long serialVersionUID = 1986913529L;

    public static final QLoanConsent loanConsent = new QLoanConsent("loanConsent");

    public final BooleanPath agreed = createBoolean("agreed");

    public final DateTimePath<java.time.LocalDateTime> agreedAt = createDateTime("agreedAt", java.time.LocalDateTime.class);

    public final StringPath bodyHash = createString("bodyHash");

    public final StringPath bodyMd = createString("bodyMd");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> customerNo = createNumber("customerNo", Integer.class);

    public final NumberPath<Long> laNo = createNumber("laNo", Long.class);

    public final NumberPath<Long> lcNo = createNumber("lcNo", Long.class);

    public final StringPath termCode = createString("termCode");

    public final StringPath termTitle = createString("termTitle");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final StringPath version = createString("version");

    public QLoanConsent(String variable) {
        super(LoanConsent.class, forVariable(variable));
    }

    public QLoanConsent(Path<? extends LoanConsent> path) {
        super(path.getType(), path.getMetadata());
    }

    public QLoanConsent(PathMetadata metadata) {
        super(LoanConsent.class, metadata);
    }

}

