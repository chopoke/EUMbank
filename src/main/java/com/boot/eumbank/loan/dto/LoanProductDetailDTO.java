package com.boot.eumbank.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanProductDetailDTO {
    // 식별/요약
    private String id;           // fin_prdt_cd
    private String name;         // fin_prdt_nm
    private String bankName;     // kor_co_nm
    private String type;         // "주택담보"
    private String desc;         // join_way + etc_note 요약
    private List<String> badges; // 금리유형/상환방식
    private List<String> tags;   // ["은행명", ...]

    // 금리/기간/한도
    private BigDecimal rateMin;      // 모든 옵션 중 최저
    private BigDecimal rateMax;      // 모든 옵션 중 최고
    private List<Integer> termMonths; // [120,240,360] 등
    private BigDecimal limitMax;    // 원 단위 최대치 (null 허용)
    private Integer ltvMax;      // % (null 허용)

    // 원문/문구
    private String loanLmtRaw;   // FSS 원문
    private String erlyRpayFee;  // 중도상환수수료 원문
    private String dlyRate;      // 연체이자율 원문
    private String joinWay;      // 가입방법 원문
    private String etcNote;      // 비고 원문

    // 세부 옵션 테이블
    @Data @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class RateOption {
        private String rpayTypeNm;
        private String lendRateTypeNm;
        private BigDecimal lendRateMin;
        private BigDecimal lendRateMax;
        private BigDecimal lendRateAvg;
        private Integer termMonth;      // (있으면) 옵션별 기간
        private String  dclsMonth;      // (있으면) 옵션 공시월
        private String  isOverdraft;    // 'Y'/'N'
        private String  note;
    }

    private List<RateOption> options;

    // 부가 섹션 (없으면 빈 리스트)
    @Data @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class Doc { private String label; private String url; }
    private List<Doc> docs;

    @Data @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class Faq { private String q; private String a; }
    private List<Faq> faq;
}
