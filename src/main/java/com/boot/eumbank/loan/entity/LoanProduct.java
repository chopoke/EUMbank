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
    private Integer loanNo;		//'대출상품번호'

    @Column(name = "lpd_code" , length = 20, unique = true)
    private String loanCode;	// '대출상품코드'

    @Column(name = "lpd_name", length = 200)
    private String loanName;	// '대출상품이름',

    @Column(name = "lpd_type", length = 20)
    private String loanType; 	// '대출종류(PERSONAL신용대출 STUDENT학자금, MORTGAGE주택담보, AUTO자동차담보, guaranteed 보증대출)',

    @Column(name = "lpd_prime_rate")
    private BigDecimal primeRate;	//'우대금리',

    @Column(name = "lpd_max_month")
    private int maxMonth; 	// '최대대출기간(개월)',

    @Column(name = "lpd_grace_month")
    private Integer graceMonth;	        // '거치기간',

    @Column(name = "lpd_policy_code", length = 30)
    private String policyCode;	    //'수수료 정책 코드',

    @Column(name = "lpd_status", length = 1)
    private String status;		// '활성화 여부',

    @Column(name = "lpd_description", length = 500)
    private String description;	//'대출 설명',

    // ---- FSS 캐시용 추가 컬럼 ----
    @Column(name = "lpd_bank_name", length = 200, nullable = false)
    private String bankName;                         // 은행명(kor_co_nm)

    @Column(name = "lpd_fin_co_no", length = 32, nullable = false)
    private String finCoNo;                          // 금융회사코드(fin_co_no)

    @Column(name = "lpd_limit_max", precision = 18, scale = 0)
    private BigDecimal limitMax;                     // 최대한도(원, 파싱결과)

    @Column(name = "lpd_ltv_max")
    private Integer ltvMax;
    // 옵션 집계 금리 DECIMAL(5,3)
    @Column(name = "lpd_rate_min", precision = 5, scale = 3)
    private BigDecimal rateMin;                      // 전체 최저금리(옵션 집계)

    @Column(name = "lpd_rate_max", precision = 5, scale = 3)
    private BigDecimal rateMax;                      // 전체 최고금리(옵션 집계)

    @Column(name = "lpd_dcls_month", length = 6)
    private String dclsMonth;                        // 공시월(YYYYMM)

    @Column(name = "lpd_join_way", length = 500)
    private String joinWay;                          // 가입방법

    @Column(name = "lpd_etc_note", length = 500)
    private String etcNote;                          // 비고(표시/검색용)

    @Lob
    @Column(name = "lpd_loan_lmt_raw", columnDefinition = "TEXT")
    private String loanLmtRaw;                       // 한도/조건 원문(재파싱용)
}
