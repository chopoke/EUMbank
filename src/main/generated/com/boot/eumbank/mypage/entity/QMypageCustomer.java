package com.boot.eumbank.mypage.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QMypageCustomer is a Querydsl query type for MypageCustomer
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMypageCustomer extends EntityPathBase<MypageCustomer> {

    private static final long serialVersionUID = 1672854261L;

    public static final QMypageCustomer mypageCustomer = new QMypageCustomer("mypageCustomer");

    public final StringPath caddress = createString("caddress");

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

    public final StringPath cnameEn = createString("cnameEn");

    public final StringPath cNameKr = createString("cNameKr");

    public final StringPath cNationalityCd = createString("cNationalityCd");

    public final StringPath cnaverid = createString("cnaverid");

    public final StringPath cPassword = createString("cPassword");

    public final StringPath cPhoneHome = createString("cPhoneHome");

    public final StringPath cPhoneMobile = createString("cPhoneMobile");

    public final StringPath cpinnumber = createString("cpinnumber");

    public final StringPath cRemark = createString("cRemark");

    public final StringPath cRiskGrade = createString("cRiskGrade");

    public final StringPath cRrnHash = createString("cRrnHash");

    public final StringPath cStatus = createString("cStatus");

    public final DateTimePath<java.time.Instant> cUpdatedAt = createDateTime("cUpdatedAt", java.time.Instant.class);

    public final StringPath cUpdatedBy = createString("cUpdatedBy");

    public final NumberPath<Integer> customerNo = createNumber("customerNo", Integer.class);

    public final StringPath email = createString("email");

    public final StringPath loginType = createString("loginType");

    public final StringPath userId = createString("userId");

    public QMypageCustomer(String variable) {
        super(MypageCustomer.class, forVariable(variable));
    }

    public QMypageCustomer(Path<? extends MypageCustomer> path) {
        super(path.getType(), path.getMetadata());
    }

    public QMypageCustomer(PathMetadata metadata) {
        super(MypageCustomer.class, metadata);
    }

}

