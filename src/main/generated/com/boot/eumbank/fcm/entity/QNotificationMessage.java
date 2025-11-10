package com.boot.eumbank.fcm.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QNotificationMessage is a Querydsl query type for NotificationMessage
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNotificationMessage extends EntityPathBase<NotificationMessage> {

    private static final long serialVersionUID = -327564301L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QNotificationMessage notificationMessage = new QNotificationMessage("notificationMessage");

    public final StringPath body = createString("body");

    public final StringPath clickActionUrl = createString("clickActionUrl");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final com.boot.eumbank.customer.entity.QCustomer customer;

    public final StringPath isRead = createString("isRead");

    public final NumberPath<Long> messageId = createNumber("messageId", Long.class);

    public final StringPath title = createString("title");

    public QNotificationMessage(String variable) {
        this(NotificationMessage.class, forVariable(variable), INITS);
    }

    public QNotificationMessage(Path<? extends NotificationMessage> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QNotificationMessage(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QNotificationMessage(PathMetadata metadata, PathInits inits) {
        this(NotificationMessage.class, metadata, inits);
    }

    public QNotificationMessage(Class<? extends NotificationMessage> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.customer = inits.isInitialized("customer") ? new com.boot.eumbank.customer.entity.QCustomer(forProperty("customer")) : null;
    }

}

