package com.boot.eumbank.customer.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCustomer is a Querydsl query type for Customer
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCustomer extends EntityPathBase<Customer> {

    private static final long serialVersionUID = -762442947L;

    public static final QCustomer customer = new QCustomer("customer");

    public final StringPath cAddress = createString("cAddress");

    public final StringPath cAgreeMarketing = createString("cAgreeMarketing");

    public final StringPath cAgreePrivacy = createString("cAgreePrivacy");

    public final StringPath cAgreeTerms = createString("cAgreeTerms");

    public final NumberPath<java.math.BigDecimal> cAmlRiskScore = createNumber("cAmlRiskScore", java.math.BigDecimal.class);

    public final NumberPath<Integer> cAuthLevel = createNumber("cAuthLevel", Integer.class);

    public final DatePath<java.time.LocalDate> cBirthDt = createDate("cBirthDt", java.time.LocalDate.class);

    public final StringPath cCiHash = createString("cCiHash");

    public final DateTimePath<java.time.Instant> cCreatedAt = createDateTime("cCreatedAt", java.time.Instant.class);

    public final StringPath cCreatedBy = createString("cCreatedBy");

    public final StringPath cDiHash = createString("cDiHash");

    public final StringPath cGenderCd = createString("cGenderCd");

    public final StringPath cId = createString("cId");

    public final StringPath cIsPep = createString("cIsPep");

    public final StringPath cIsSanctionHit = createString("cIsSanctionHit");

    public final StringPath cNameEn = createString("cNameEn");

    public final StringPath cNameKr = createString("cNameKr");

    public final StringPath cNationalityCd = createString("cNationalityCd");

    public final StringPath cPassword = createString("cPassword");

    public final StringPath cPhoneHome = createString("cPhoneHome");

    public final StringPath cPhoneMobile = createString("cPhoneMobile");

    public final StringPath cRemark = createString("cRemark");

    public final StringPath cRiskGrade = createString("cRiskGrade");

    public final StringPath cRrnHash = createString("cRrnHash");

    public final StringPath cStatus = createString("cStatus");

    public final DateTimePath<java.time.Instant> cUpdatedAt = createDateTime("cUpdatedAt", java.time.Instant.class);

    public final StringPath cUpdatedBy = createString("cUpdatedBy");

    public final NumberPath<Integer> customerNo = createNumber("customerNo", Integer.class);

    public final StringPath cZipCode = createString("cZipCode");

    public final StringPath email = createString("email");

    public final StringPath loginType = createString("loginType");

    public final StringPath naverId = createString("naverId");

    public final StringPath pinNumber = createString("pinNumber");

    public final StringPath role = createString("role");

    public final StringPath userId = createString("userId");

    public QCustomer(String variable) {
        super(Customer.class, forVariable(variable));
    }

    public QCustomer(Path<? extends Customer> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCustomer(PathMetadata metadata) {
        super(Customer.class, metadata);
    }

}

