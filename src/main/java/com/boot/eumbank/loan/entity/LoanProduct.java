package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "LOAN_PRODUCT_TBL")
public class LoanProduct {
    @Id
    @Column(name = "lpd_no")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long loanNo;		//'대출상품번호'

    @Column(name = "lpd_code" , length = 20, unique = true)
    private String loanCode;	// '대출상품코드'

    @Column(name = "lpd_type", length = 30)
    private String loanType; 	// '대출종류(PERSONAL신용대출 JEONSE전세자금 MORTGAGE주택담보)'

    // 공통필드 -----------------------------------------
    @Column(name="lpd_fin_co_no")
    private String finCoNo;     // 금융회사 코드

    @Column(name="lpd_bank_name")
    private String bankName;

    @Column(name = "lpd_name", length = 200)
    private String loanName;	// '대출상품이름',

    @Column(name="lpd_join_way")
    private String joinWay;     // 가입 방법

    @Column(name = "lpd_dcls_month", length = 6)
    private String dclsMonth;                        // 공시월(YYYYMM)

    @Column(name="lpd_dcls_start_day")
    private String dclsStartDay;                // 공시시작월(YYYYMMDD)

    @Column(name="lpd_dcls_end_day")
    private String dclsEndDay;                  // 공시종료일(YYYYMMDD)

    @Column(name="lpd_fin_co_subm_day")
    private String finCoSubmDay;                // 금융회사 제출일(YYYYMMDDHH24MI)


    // 전세(JEONSE) 주담대(MORTGAGE) 전용 필드 --------------------------------
    @Column(name="lpd_loan_inci_expn")
    private String loanInciExpn;            // 대출부대비용(원문)

    @Column(name="lpd_erly_rpay_fee")
    private String erlyRpayFee;             // 중도상환수수료 (원문)

    @Column(name="lpd_dly_rate")
    private String dlyRate;                 // 연체이자율(원문)

    @Column(name="lpd_loan_lmt_raw", columnDefinition = "TEXT")
    private String loanLmtRaw;              // 한도(원문)


    // 집계, 검색용 ㅇ-------------------------------------
    @Column(name="lpd_rate_min", precision=5, scale=2)
    private BigDecimal rateMin;                         // 최저금리

    @Column(name="lpd_rate_max", precision=5, scale=2)
    private BigDecimal rateMax;                          // 최고금리

    @Column(name="lpd_limit_max", precision=18, scale=0)
    private BigDecimal limitMax;                // 대출한도

    @Column(name="lpd_ltv_max")
    private Integer ltvMax;                     // 최대LTV(신용은 null)

    @Column(name="lpd_is_active", nullable=false)
    private Boolean isActive;           // 활성화여부

    @Column(name="lpd_source_type", nullable=false)
    private String sourceType;          // 대출상품 가져온 곳(ex API, ADMIN)

    @Column(name="lpd_summary") 
    private String summary;             // 한줄소개

    @Column(name="lpd_created_at", insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime createdAt;        // 생성일
    
    @Column(name="lpd_updated_at", insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime updatedAt;        // 업뎃ㅇ리
}
