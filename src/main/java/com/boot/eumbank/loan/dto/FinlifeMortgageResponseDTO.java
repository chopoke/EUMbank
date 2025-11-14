package com.boot.eumbank.loan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FinlifeMortgageResponseDTO {

    @JsonProperty("result")
    private Result result;

    // 모든 상품 공통
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        @JsonProperty("baseList")
        private List<Base> baseList;
        @JsonProperty("optionList")
        private List<Option> optionList;

        @JsonProperty("total_count") private Integer totalCount;    // 총상품갯수
        @JsonProperty("max_page_no") private Integer maxPageNo;     // 최대페이지수
        @JsonProperty("now_page_no") private Integer nowPageNo;     // 현재페이지수
        @JsonProperty("err_cd")     private String  errCd;          // 응답코드
        @JsonProperty("err_msg")    private String  errMsg;         // 응답메세지
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Base {
        // 전세자금/주택담보/신용대출 공통 필드들
        @JsonProperty("fin_prdt_cd") private String finPrdtCd;  // 상품코드 (옵션과 join)
        @JsonProperty("fin_co_no")   private String finCoNo;    // 금융회사 코드
        @JsonProperty("kor_co_nm")   private String korCoNm;    // 금융회사명(은행명)
        @JsonProperty("fin_prdt_nm") private String finPrdtNm;  // 상품명
        @JsonProperty("dcls_month")  private String dclsMonth;  // 공시제출월
        @JsonProperty("join_way")      private String joinWay;     // 가입방법
        @JsonProperty("dcls_strt_day") private String dclsStrtDay;      // 공시시작일
        @JsonProperty("dcls_end_day")   private String dclsEndDay;      // 공시종료일
        @JsonProperty("fin_co_subm_day")  private String finCoSubmDay;   // 금융회사제출일 YYYYMMDDHH24MI

        // 전세자금/주택담보 공통 필드들 
        @JsonProperty("loan_inci_expn") private String loanInciExpn;     // 대출 부대비용
        @JsonProperty("erly_rpay_fee") private String erlyRpayFee;          // 중도상환 수수료
        @JsonProperty("dly_rate")      private String dlyRate;     // 연체이율
        @JsonProperty("loan_lmt")      private String loanLmt;     // 대출한도(문자열일 수 있음)
        @JsonProperty("etc_note")      private String etcNote;     // 비고
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Option {
        @JsonProperty("fin_prdt_cd")      private String finPrdtCd;     // 조인키

        @JsonProperty("mrtg_type_nm")     private String mrtgTypeNm;        // 담보 유형명
        @JsonProperty("rpay_type_nm")     private String rpayTypeNm;        // 상환방식명
        @JsonProperty("lend_rate_type_nm")private String lendRateTypeNm;    // 금리유형명
        @JsonProperty("lend_rate_min")    private BigDecimal lendRateMin;   // 최저금리
        @JsonProperty("lend_rate_max")    private BigDecimal lendRateMax;   // 최고금리
        @JsonProperty("lend_rate_avg")    private BigDecimal lendRateAvg;   // 평균금리
    }
}
