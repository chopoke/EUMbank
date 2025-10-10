package com.boot.eumbank.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "CUSTOMER_TBL")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "c_no")
    private Long cNo;

    @Column(name = "c_id")
    private String cId;

    @Column(name = "c_user_id")
    private String userId;

    @Column(name = "c_password")
    private String password;

    @Column(name = "c_name_kr")
    private String nameKr;

    @Column(name = "c_name_en")
    private String nameEn;

    @Column(name = "c_birth_dt")
    private LocalDateTime birthDt;

    @Column(name = "c_gender_cd")
    private String genderCd;

    @Column(name = "c_nationality_cd")
    private String nationalityCd;

    @Column(name = "c_phone_mobile")
    private String phoneMobile;

    @Column(name = "c_phone_home")
    private String phoneHome;

    @Column(name = "c_email")
    private String email;

    @Column(name = "c_rrn_hash")
    private String rrnHash;

    @Column(name = "c_di_hash")
    private String diHash;

    @Column(name = "c_ci_hash")
    private String ciHash;

    @Column(name = "c_auth_level")
    private Integer authLevel;

    @Column(name = "c_risk_grade")
    private String riskGrade;

    @Column(name = "c_aml_risk_score")
    private BigDecimal amlRiskScore;

    @Column(name = "c_is_pep")
    private String isPep;

    @Column(name = "c_is_sanction_hit")
    private String isSanctionHit;

    @Column(name = "c_status")
    private String status;

    @Column(name = "c_remark")
    private String remark;

    @Column(name = "c_created_at")
    private LocalDateTime createdAt;

    @Column(name = "c_created_by")
    private String createdBy;

    @Column(name = "c_updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "c_updated_by")
    private String updatedBy;
}