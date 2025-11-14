package com.boot.eumbank.loan.dto.apply;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder @AllArgsConstructor @NoArgsConstructor
public class LoanApplicationRequestDTO {
    // 식별 (둘 중 아무거나)
    private Integer customerNo;
    private String productCode;

    @JsonAlias({"lpdNo","lpd_no"})
    private Long lpdNo;

    // 계좌 (V1 / V2 모두 흡수)
    @JsonAlias({"laPayoutANo","la_payout_a_no"})
    private Integer payoutAccountNo;
    @JsonAlias({"laRepayANo","la_repay_a_no"})
    private Integer repayAccountNo;

    // 금액/기간 (V1 / V2 모두 흡수)
    @JsonAlias({"laApplAmount","la_appl_amount"})
    private BigDecimal desiredAmount;
    @JsonAlias({"laDesiredTerm","la_desired_term"})
    private Integer desiredTerm;

    // 신청건별 구분용 키
    @JsonAlias("batchKey")
    private String termsBatchKey;

    // 한글 저장 정책 필드
    @JsonAlias({"laPurposeCode","la_purpose_code"})
    private String purposeCode;
    @JsonAlias({"laRateType","la_rate_type"})
    private String rateType;  // 고정금리/변동금리
    @JsonAlias({"laRpayType","la_rpay_type"})
    private String rpayType;  // 원리금균등/원금균등(분할상환)/만기일시

    // 기타 입력
    private String occupation;
    private Long incomeAnnual;
    private Long collateralValue;
    private Long jeonseDeposit;

    // 견적 echo
    private BigDecimal quoteApprovedAmount;
    private BigDecimal quoteAppliedRate;
    private Integer quoteApprovedTerm;
    private Long quoteMonthlyPayment;

    @JsonAlias({"laRiskScore","la_risk_score"})
    private Integer riskScore;

    private String channel; // "WEB" 등
    private Map<String,Object> extra;

    // 동의 항목리스트
    @JsonAlias({"laConsents"})
    private List<ConsentItem> consents;

    @Data
    @AllArgsConstructor @NoArgsConstructor
    public static class ConsentItem {
        private String code;       // 예: "PERS_INFO", "CREDIT_INQUIRY"
        private Boolean agreed;    // true/false
        private String agreedAt;   // ISO-8601 (선택)
    }
}
