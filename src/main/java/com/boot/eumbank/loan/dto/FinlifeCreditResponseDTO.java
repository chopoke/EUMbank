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
        @JsonProperty("baseList")  private List<Base> baseList;             // 기본 정보
        @JsonProperty("optionList")private List<Option> optionList;         // 옵션 정보
        @JsonProperty("total_count") private Integer totalCount;            // 갯수
        @JsonProperty("max_page_no") private Integer maxPageNo;             // 최종 페이지수
        @JsonProperty("now_page_no") private Integer nowPageNo;             // 지금 페이지
        @JsonProperty("err_cd")     private String errCd;                   // 에러코드
        @JsonProperty("err_msg")    private String errMsg;                  // 에러메세ㅣㅈ
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Base {
        @JsonProperty("fin_prdt_cd") private String finPrdtCd;
        @JsonProperty("fin_co_no")   private String finCoNo;
        @JsonProperty("kor_co_nm")   private String korCoNm;
        @JsonProperty("fin_prdt_nm") private String finPrdtNm;
        @JsonProperty("dcls_month")  private String dclsMonth;
        @JsonProperty("crdt_prdt_type")    private String crdtPrdtType;     // 신용 타입
        @JsonProperty("crdt_prdt_type_nm") private String crdtPrdtTypeNm;   //

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
        @JsonProperty("crdt_prdt_type")       private String crdtPrdtType;         // ★
        @JsonProperty("crdt_lend_rate_type")  private String crdtLendRateType;     // A/B/C
        // 신용 등급들
        @JsonProperty("crdt_grad_1")  private BigDecimal grad1;
        @JsonProperty("crdt_grad_4")  private BigDecimal grad4;
        @JsonProperty("crdt_grad_5")  private BigDecimal grad5;
        @JsonProperty("crdt_grad_6")  private BigDecimal grad6;
        @JsonProperty("crdt_grad_10") private BigDecimal grad10;
        @JsonProperty("crdt_grad_11") private BigDecimal grad11;
        @JsonProperty("crdt_grad_12") private BigDecimal grad12;
        @JsonProperty("crdt_grad_13") private BigDecimal grad13;
        @JsonProperty("crdt_grad_avg") private BigDecimal gradAvg;
    }
}
