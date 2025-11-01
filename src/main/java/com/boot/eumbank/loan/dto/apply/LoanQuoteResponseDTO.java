package com.boot.eumbank.loan.dto.apply;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder @AllArgsConstructor @NoArgsConstructor
public class LoanQuoteResponseDTO {
    private String loanCode;
    private String loanName;
    private String type;

    private BigDecimal appliedRate;     // 최종적용금리(%)
    private BigDecimal approvedAmount;  // 승인(가능)금액
    private Integer approvedTerm;       // 필요 시 확장
    private BigDecimal monthlyPayment;  // 월 상환액
    private BigDecimal totalInterest;   // 총 이자

    private BigDecimal maxLimit;        // 내부 계산상 최대한도
    private Map<String, String> calcTrace; // 디버그/설명용


    private Integer usedLtv;            // LTV 담보대출용
    private String rpayType;            // 상환방식(ANNUITY/EQUAL_PRINCIPAL/BULLET)
}
