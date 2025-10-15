package com.boot.eumbank.account.Open.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * 고객 정보(CUSTOMER_TBL)를 위한 DTO
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
public class CustomerDTO {

    // 고객 번호 (PK)
    private Integer cNo;

    // 고객 ID
    private String cId;

    // 사용자 ID
    private String userId;

    // 비밀번호
    private String password;

    // 고객명 (한글)
    private String nameKr;

    // 고객명 (영문)
    private String nameEn;

    // 생년월일
    private LocalDateTime birthDt;

    // 성별 코드
    private String genderCd;

    // 국적 코드
    private String nationalityCd;

    // 휴대폰 번호
    private String phoneMobile;

    // 자택 전화번호
    private String phoneHome;

    // 이메일
    private String email;

    // 주민등록번호 해시
    private String rrnHash;

    // DI 해시
    private String diHash;

    // CI 해시
    private String ciHash;

    // 인증 레벨
    private Integer authLevel;

    // 위험 등급
    private String riskGrade;

    // AML 위험 점수
    private BigDecimal amlRiskScore;

    // PEP 여부
    private String isPep;

    // 제재 대상 여부
    private String isSanctionHit;

    // 고객 상태
    private String status;

    // 비고
    private String remark;

    // 생성 일시
    private LocalDateTime createdAt;

    // 생성자
    private String createdBy;

    // 수정 일시
    private LocalDateTime updatedAt;

    // 수정자
    private String updatedBy;

    /**
     * QueryDSL의 Projections.constructor와 정확히 일치하는 생성자
     * 순서: cNo(Integer), nameKr(String), email(String), phoneMobile(String)
     */
    public CustomerDTO(Integer customerNo, String cNameKr, Instant cBirthDt, String cEmail, String cPhoneMobile) {
        this.cNo = customerNo;
        this.nameKr = cNameKr;
        this.birthDt = cBirthDt.atZone(ZoneId.systemDefault()).toLocalDateTime();
        this.email = cEmail;
        this.phoneMobile = cPhoneMobile;
    }

}