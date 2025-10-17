package com.boot.eumbank.loan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FinlifeMortgageResponseDTO {

    @JsonProperty("result")
    private Result result;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {

        private List<Base> baseList;
        private List<Option> optionList;

        @JsonProperty("total_count") private Integer totalCount;
        @JsonProperty("max_page_no") private Integer maxPageNo;
        @JsonProperty("now_page_no") private Integer nowPageNo;
        @JsonProperty("err_cd")     private String  errCd;
        @JsonProperty("err_msg")    private String  errMsg;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Base {
        // --- 식별/기본 정보 ---
        @JsonProperty("fin_prdt_cd") private String finPrdtCd;  // 상품코드(옵션과 join key)
        @JsonProperty("fin_co_no")   private String finCoNo;    // 금융회사 코드
        @JsonProperty("kor_co_nm")   private String korCoNm;    // 금융회사명(은행명)
        @JsonProperty("fin_prdt_nm") private String finPrdtNm;  // 상품명
        @JsonProperty("dcls_month")  private String dclsMonth;

        // --- 기타 정보 ---
        @JsonProperty("erly_rpay_fee") private String erlyRpayFee; // 중도상환수수료
        @JsonProperty("dly_rate")      private String dlyRate;     // 연체이율
        @JsonProperty("loan_lmt")      private String loanLmt;     // 대출한도(문자열일 수 있음)
        @JsonProperty("join_way")      private String joinWay;     // 가입방법
        @JsonProperty("etc_note")      private String etcNote;     // 비고
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Option {
        @JsonProperty("fin_prdt_cd")      private String finPrdtCd;     // 조인키
        @JsonProperty("rpay_type_nm")     private String rpayTypeNm;    // 상환방식명
        @JsonProperty("lend_rate_type_nm")private String lendRateTypeNm;// 금리유형명
        @JsonProperty("lend_rate_min")    private Double lendRateMin;   // 최저금리
        @JsonProperty("lend_rate_max")    private Double lendRateMax;   // 최고금리
        @JsonProperty("lend_rate_avg")    private Double lendRateAvg;   // 평균금리(있을 때)
    }
}
