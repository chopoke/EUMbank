package com.boot.eumbank.loan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinlifeMortgageResponseDTO {
    // 응답 최상위 노드
    private Result result;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Result{
        private List<Base> baseList;        // 상품 기본 정보 배열
        private List<Option> optionList;    // 금리/상환 옵션 배열
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Base{
        /** 상품코드(옵션과 join key) */
        private String finPrdtCd;
        /** 금융회사명(은행명) */
        private String korCoNm;
        /** 상품명 */
        private String finPrdtNm;
        /** 중도상환수수료(문자열로 표기될 수 있음) */
        private String erlyRpayFee;
        /** 연체이율(문자열로 표기될 수 있음) */
        private String dlyRate;
        /** 대출한도(문자열로 표기될 수 있음 ex. "최대한도 5억원") */
        private String loanLmt;
        /** 가입방법(인터넷/영업점 등) */
        private String joinWay;
        /** 기타 비고 */
        private String etcNote;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Option{
        /** 상품코드(= Base.finPrdtCd와 조인) */
        private String finPrdtCd;
        /** 상환방식명(원리금균등/원금균등/만기일시 등) */
        private String rpayTypeNm;
        /** 금리유형명(고정/변동/혼합 등) */
        private String lendRateTypeNm;
        /** 최저 금리 */
        private Double lendRateMin;
        /** 최고 금리 */
        private Double lendRateMax;
        /** 평균 금리(있을 경우) */
        private Double lendRateAvg;
    }
}
