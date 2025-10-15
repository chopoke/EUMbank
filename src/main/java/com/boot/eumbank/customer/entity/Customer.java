package com.boot.eumbank.customer.entity;

import com.boot.eumbank.customer.dto.SignupRequest;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "CUSTOMER_TBL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "c_no")
    private Integer customerNo;

    @Column(name = "c_id", nullable = false, length = 20)
    private String cId;

    @Column(name = "c_user_id", nullable = false, length = 50, unique = true)
    private String userId;

    @Column(name = "c_password", nullable = false, length = 100)
    private String cPassword;

    @Column(name = "c_name_kr", nullable = false, length = 100)
    private String cNameKr;

    @Column(name = "c_name_en", length = 100)
    private String cNameEn;

    @Column(name = "c_birth_dt")
    private Instant cBirthDt;

    @Column(name = "c_gender_cd", length = 1)
    private String cGenderCd;

    @Column(name = "c_nationality_cd", nullable = false, length = 3)
    @Builder.Default
    private String cNationalityCd = "KOR";

    @Column(name = "c_phone_mobile", nullable = false, length = 20)
    private String cPhoneMobile;

    @Column(name = "c_phone_home", length = 20)
    private String cPhoneHome;

    @Column(name = "c_email", nullable = false, length = 150)
    private String cEmail;

    @Column(name = "c_rrn_hash", length = 256)
    private String cRrnHash;

    @Column(name = "c_di_hash", length = 256)
    private String cDiHash;

    @Column(name = "c_ci_hash", length = 256)
    private String cCiHash;

    @Column(name = "c_auth_level", nullable = false)
    @Builder.Default
    private Integer cAuthLevel = 1;

    @Column(name = "c_risk_grade", nullable = false, length = 10)
    @Builder.Default
    private String cRiskGrade = "LOW";

    @Column(name = "c_aml_risk_score", precision = 5, scale = 2)
    private BigDecimal cAmlRiskScore;

    @Column(name = "c_is_pep", nullable = false, length = 1)
    @Builder.Default
    private String cIsPep = "N";

    @Column(name = "c_is_sanction_hit", nullable = false, length = 1)
    @Builder.Default
    private String cIsSanctionHit = "N";

    @Column(name = "c_status", nullable = false, length = 20)
    @Builder.Default
    private String cStatus = "ACTIVE";

    @Column(name = "c_remark", length = 4000)
    private String cRemark;

    @Column(name = "c_created_at", nullable = false)
    @Builder.Default
    private Instant cCreatedAt = Instant.now();

    @Column(name = "c_created_by", nullable = false, length = 50)
    @Builder.Default
    private String cCreatedBy = "SYSTEM";

    @Column(name = "c_updated_at")
    private Instant cUpdatedAt;

    @Column(name = "c_updated_by", length = 50)
    private String cUpdatedBy;

    @Column(name = "c_agree_terms", nullable = false, length = 1)
    private String cAgreeTerms;                         // 서비스이용약관동의 (Y/N)

    @Column(name = "c_agree_privacy", nullable = false, length = 1)
    private String cAgreePrivacy;                       // 개인정보처리방침동의 (Y/N)

    @Column(name = "c_agree_marketing", length = 1)
    private String cAgreeMarketing;                     // 마케팅정보수신동의 (Y/N)

    @Column(name = "c_login_type", nullable = false, length = 20)
    @Builder.Default
    private String loginType = "EUM";

    public void updateCustomer(SignupRequest signupRequest) {
        this.cPassword = signupRequest.getC_password();
        this.cNameKr = signupRequest.getC_name_kr();
        this.cEmail = signupRequest.getC_email();
        this.cPhoneMobile = signupRequest.getC_phone_mobile();
    }
}