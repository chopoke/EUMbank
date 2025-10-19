package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.yaml.snakeyaml.tokens.BlockEndToken;

import java.math.BigDecimal;

@Entity
@Data
@Table(name = "LOAN_PRODUCT_TBL")
public class LoanProduct {
    @Id
    @Column(name = "lpd_no")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int loanNo;		//'대출상품번호'

    @Column(name = "lpd_code" , length = 20, unique = true)
    private String loanCode;	// '대출상품코드'

    @Column(name = "lpd_name", length = 200)
    private String loanName;	// '대출상품이름',

    @Column(name = "lpd_type", length = 20)
    private String loanType; 	// '대출종류(PERSONAL신용대출 STUDENT학자금, MORTGAGE주택담보, AUTO자동차담보, guaranteed 보증대출)',

    @Column(name = "lpd_rate_type", length = 10)
    private String rateType;	    // '금리유형(고정:FIXED / 변동:FLOAT / 혼합:HYBRID)'

    @Column(name = "lpd_base_rate", length = 20)
    private String baseRate;    	// '기준금리(주로 변동금리시 사용 고정시NULL - BOK_BASE 한국은행 기준 금리 / PRIME 우대금리 , COFIX_6M, COFIX_1Y )',

    @Column(name = "lpd_prime_rate")
    private BigDecimal primeRate;	//'우대금리',

    @Column(name = "lpd_max_month")
    private int maxMonth; 	// '최대대출기간(개월)',

    @Column(name = "lpd_repay_method", length = 20)
    private String repayMethod;	        //'상환방식(EQUAL_PNI 원리금균등 / EQUAL_PRINCIPAL 원금균등 / BULLET 만기일시 / IO_THEN_PNI 거치후원리금균등)',

    @Column(name = "lpd_grace_month")
    private int graceMonth;	        // '거치기간',

    @Column(name = "lpd_policy_code", length = 30)
    private String policyCode;	    //'수수료 정책 코드',

    @Column(name = "lpd_status", length = 1)
    private String status;		// '활성화 여부',

    @Column(name = "lpd_description", length = 500)
    private String description;	//'대출 설명',



    // ---- FSS 캐시용 추가 컬럼(표시/필터에 필요한 값만) ----
    @Column(name = "lpd_bank_name", length = 200) private String bankName;     // kor_co_nm
    @Column(name = "lpd_fin_co_no", length = 32)   private String finCoNo;     // fin_co_no
    @Column(name = "lpd_loan_lmt_raw", columnDefinition = "TEXT") private String loanLmtRaw; // loan_lmt 원문
    @Column(name = "lpd_limit_max") private Long limitMax;    // 파싱된 한도(원)
    @Column(name = "lpd_ltv_max")   private Integer ltvMax;   // 파싱된 LTV(%)
    @Column(name = "lpd_rate_min")  private Double rateMin;   // 옵션 집계: 최저
    @Column(name = "lpd_rate_max")  private Double rateMax;   // 옵션 집계: 최고
    @Column(name = "lpd_dcls_month", length = 6) private String dclsMonth;     // 공시월
    @Column(name = "lpd_join_way", length = 500) private String joinWay;       // 가입방법
    @Column(name = "lpd_etc_note", columnDefinition = "TEXT") private String etcNote; // 비고
}
