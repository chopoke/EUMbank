package com.boot.eumbank.loan.dto.apply;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder @AllArgsConstructor @NoArgsConstructor
public class LoanQuoteRequestDTO {
    // 공통
    private Long customerNo;           // 있으면 활용 (지금은 옵션)
    private BigDecimal desiredAmount;
    private Integer desiredTerm;       // 개월
    private String occupation;         // 직장인/공무원/전문직/자영업자/프리랜서 등

    // 신용대출 가정치
    private BigDecimal annualIncome;

    // 담보/전세 가정치
    private BigDecimal collateralValue;  // 담보가
    private BigDecimal jeonseDeposit;    // 전세보증금
    
    // 옵션
    private String rateType;
    private String rpayType;   // 만기일시상환방식/원금균등상환방식/원리금균등상환방식
    private Map<String, Object> extra;
}
