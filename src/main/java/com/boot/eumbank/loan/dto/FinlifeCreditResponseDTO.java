package com.boot.eumbank.loan.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FinlifeCreditResponseDTO {
    private Result result;

    @Data @NoArgsConstructor @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        @JsonProperty("baseList")  private List<Base> baseList;
        @JsonProperty("optionList")private List<Option> optionList;
        @JsonProperty("total_count") private Integer totalCount;
        @JsonProperty("max_page_no") private Integer maxPageNo;
        @JsonProperty("now_page_no") private Integer nowPageNo;
        @JsonProperty("err_cd")     private String errCd;
        @JsonProperty("err_msg")    private String errMsg;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Base {
        @JsonProperty("fin_prdt_cd") private String finPrdtCd;
        @JsonProperty("fin_co_no")   private String finCoNo;
        @JsonProperty("kor_co_nm")   private String korCoNm;
        @JsonProperty("fin_prdt_nm") private String finPrdtNm;
        @JsonProperty("dcls_month")  private String dclsMonth;

        // 신용대출 전용/공통 필드들 (원본 확인 후 매핑)
        @JsonProperty("loan_lmt")    private String loanLmt;   // (있으면)
        @JsonProperty("join_way")    private String joinWay;
        @JsonProperty("etc_note")    private String etcNote;
        @JsonProperty("erly_rpay_fee") private String erlyRpayFee;
        @JsonProperty("dly_rate")      private String dlyRate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Option {
        @JsonProperty("fin_prdt_cd")      private String finPrdtCd;
        @JsonProperty("rpay_type_nm")     private String rpayTypeNm;
        @JsonProperty("lend_rate_type_nm")private String lendRateTypeNm;
        @JsonProperty("lend_rate_min")    private BigDecimal lendRateMin;
        @JsonProperty("lend_rate_max")    private BigDecimal  lendRateMax;
        @JsonProperty("lend_rate_avg")    private BigDecimal  lendRateAvg;
    }
}
