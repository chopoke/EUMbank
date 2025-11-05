//package com.boot.eumbank.loan.dto;
//
//import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
//import com.fasterxml.jackson.annotation.JsonProperty;
//import lombok.*;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.List;
//
//@Data @NoArgsConstructor @AllArgsConstructor
//@JsonIgnoreProperties(ignoreUnknown = true)
//public class FinlifeCreditResponseDTO {
//    private Result result;
//
//    // 모든 대출 공통 필드
//    @Data @NoArgsConstructor @AllArgsConstructor
//    @JsonIgnoreProperties(ignoreUnknown = true)
//    public static class Result {
//        @JsonProperty("baseList")  private List<Base> baseList;             // 기본 정보
//        @JsonProperty("optionList")private List<Option> optionList;         // 옵션 정보
//
//        @JsonProperty("total_count") private Integer totalCount;            // 총상품갯수
//        @JsonProperty("max_page_no") private Integer maxPageNo;             // 최종 페이지수
//        @JsonProperty("now_page_no") private Integer nowPageNo;             // 지금 페이지
//        @JsonProperty("err_cd")     private String errCd;                   // 에러코드
//        @JsonProperty("err_msg")    private String errMsg;                  // 에러메세ㅣㅈ
//    }
//
//    @Data @NoArgsConstructor @AllArgsConstructor
//    @JsonIgnoreProperties(ignoreUnknown = true)
//    public static class Base {
//        @JsonProperty("fin_prdt_cd") private String finPrdtCd;              // 상품코드(옵션과 조인)
//        @JsonProperty("fin_prdt_nm") private String finPrdtNm;              // 상품명
//        @JsonProperty("fin_co_no")   private String finCoNo;                // 금융회사코드
//        @JsonProperty("kor_co_nm")   private String korCoNm;                // 금융회사명
//        @JsonProperty("dcls_month")  private String dclsMonth;              // 공시월
//        @JsonProperty("join_way")    private String joinWay;                // 가입방법
//        @JsonProperty("dcls_strt_day") private String dclsStrtDay;      // 공시시작일
//        @JsonProperty("dcls_end_day")   private String dclsEndDay;      // 공시종료일
//        @JsonProperty("fin_co_subm_day")  private String finCoSubmDay;   // 금융회사제출일 YYYYMMDDHH24MI
//
//
//
//        // BASE용 신용대출 전용 필드
//        @JsonProperty("crdt_prdt_type")    private String crdtPrdtType;     // 대출종류(신용)타입
//        @JsonProperty("crdt_prdt_type_nm") private String crdtPrdtTypeNm;   // 대출종류(신용)명
//        @JsonProperty("cb_name")     private String cbName;                 // CB회사명 -.> NICE만 들어올것임
//        @JsonProperty("etc_note")    private String etcNote;
//    }
//
//    @Data @NoArgsConstructor @AllArgsConstructor
//    @JsonIgnoreProperties(ignoreUnknown = true)
//    public static class Option {
//        @JsonProperty("fin_prdt_cd")      private String finPrdtCd;     // 조인용
//
//        @JsonProperty("crdt_lend_rate_type") private String crdtLendRateType;       // 금리 구분 코드
//        @JsonProperty("crdt_lend_rate_type_nm") private String crdtLendRateTypeNm;  // 금리구분
//
//        // 신용 등급들
//        @JsonProperty("crdt_grad_1")  private BigDecimal grad1;         // 900점 초과
//        @JsonProperty("crdt_grad_4")  private BigDecimal grad4;         // 801~900
//        @JsonProperty("crdt_grad_5")  private BigDecimal grad5;         // 701~800
//        @JsonProperty("crdt_grad_6")  private BigDecimal grad6;         // 601~700
//        @JsonProperty("crdt_grad_10") private BigDecimal grad10;        // 501~600
//        @JsonProperty("crdt_grad_11") private BigDecimal grad11;        // 401~500
//        @JsonProperty("crdt_grad_12") private BigDecimal grad12;        // 301~400
//        @JsonProperty("crdt_grad_13") private BigDecimal grad13;        // 201~300
//        @JsonProperty("crdt_grad_avg") private BigDecimal gradAvg;
//    }
//}
