package com.boot.eumbank.bill.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QElectricAvg is a Querydsl query type for ElectricAvg
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QElectricAvg extends EntityPathBase<ElectricAvg> {

    private static final long serialVersionUID = 886284269L;

    public static final QElectricAvg electricAvg = new QElectricAvg("electricAvg");

    public final StringPath eaAreaCd = createString("eaAreaCd");

    public final NumberPath<java.math.BigDecimal> eaAvgUnit = createNumber("eaAvgUnit", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> eaCreatedAt = createDateTime("eaCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> eaId = createNumber("eaId", Integer.class);

    public final NumberPath<Integer> eaMonth = createNumber("eaMonth", Integer.class);

    public final NumberPath<Integer> eaYear = createNumber("eaYear", Integer.class);

    public QElectricAvg(String variable) {
        super(ElectricAvg.class, forVariable(variable));
    }

    public QElectricAvg(Path<? extends ElectricAvg> path) {
        super(path.getType(), path.getMetadata());
    }

    public QElectricAvg(PathMetadata metadata) {
        super(ElectricAvg.class, metadata);
    }

}

