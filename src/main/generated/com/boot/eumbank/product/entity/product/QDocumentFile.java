package com.boot.eumbank.product.entity.product;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QDocumentFile is a Querydsl query type for DocumentFile
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDocumentFile extends EntityPathBase<DocumentFile> {

    private static final long serialVersionUID = -604260738L;

    public static final QDocumentFile documentFile = new QDocumentFile("documentFile");

    public final NumberPath<Integer> aNo = createNumber("aNo", Integer.class);

    public final NumberPath<Integer> cNo = createNumber("cNo", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> dNo = createNumber("dNo", Integer.class);

    public final StringPath pdfName = createString("pdfName");

    public final StringPath pdfPath = createString("pdfPath");

    public final EnumPath<com.boot.eumbank.account.open.enums.DocumentStatus> status = createEnum("status", com.boot.eumbank.account.open.enums.DocumentStatus.class);

    public final EnumPath<com.boot.eumbank.account.open.enums.FileType> type = createEnum("type", com.boot.eumbank.account.open.enums.FileType.class);

    public QDocumentFile(String variable) {
        super(DocumentFile.class, forVariable(variable));
    }

    public QDocumentFile(Path<? extends DocumentFile> path) {
        super(path.getType(), path.getMetadata());
    }

    public QDocumentFile(PathMetadata metadata) {
        super(DocumentFile.class, metadata);
    }

}

