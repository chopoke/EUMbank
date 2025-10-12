package com.boot.eumbank.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Data
@Table(name="CUSTOMER_TBL")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int c_no;

    @Column(unique = true, nullable = false)
    private String c_id;	            // 고객ID
    private String c_user_id;	        // 아이디
    private String c_password;          // 비밀번호
    private String c_name_kr;	        // 한글이름
    private String c_name_en;	        // 영어이름
    private Timestamp c_birth_dt;	    // 생년월일
    private String c_gender_cd;         // 성별
    private String c_nationality_cd;	// DEFAULT 'KOR' 국적코드
    private String c_phone_mobile;      // 휴대전화
    private String c_phone_home;	    // 집전화
    private String c_email;             // 이메일
    private String c_rrn_hash;	        // 주민번호 해시
    private String c_di_hash;	        // 본인중복확인해시값
    private String c_ci_hash;	        // 본인확인해시값
    private int c_auth_level;           // DEFAULT 1 COMMENT 인증레벨
    private String c_risk_grade;	    // DEFAULT 'LOW'  '위험등급',
    private BigDecimal c_aml_risk_score;// AML점수
    private String c_is_pep;	        // DEFAULT 'N'  'PEP여부',
    private String c_is_sanction_hit;	// DEFAULT 'N'  '제재대상여부',
    private String c_status;	        // DEFAULT 'ACTIVE'  '고객상태',
    private String c_remark;	        // '비고',
    private Timestamp c_created_at;	    // DEFAULT CURRENT_TIMESTAMP  '생성일시'
    private String c_created_by;	    // DEFAULT 'SYSTEM'  '생성자'
    private Timestamp c_updated_at; 	//  '수정일시'
    private String c_updated_by;        //	'수정자'

}
