// src/main/java/com/boot/eumbank/loan/dto/apply/LoanQuoteResponseDTO.java
package com.boot.eumbank.loan.dto.apply;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoanQuoteResponseDTO {

    @JsonProperty("loanCode")
    private String loanCode;

    @JsonProperty("loanName")
    private String loanName;

    @JsonProperty("type")
    private String type;                  // CREDIT / JEONSE / MORTGAGE

    @JsonProperty("rateType")
    private String rateType;              // "고정금리" / "변동금리"

    @JsonProperty("rpayType")
    private String rpayType;              // "ANNUITY" / "EQUAL_PRINCIPAL" / "BULLET"

    @JsonProperty("appliedRate")
    private BigDecimal appliedRate;       // 최종 적용금리(%)

    @JsonProperty("approvedAmount")
    private BigDecimal approvedAmount;    // 승인(가능)금액

    @JsonProperty("approvedTerm")
    private Integer approvedTerm;         // 개월

    @JsonProperty("monthlyPayment")
    private BigDecimal monthlyPayment;    // 월 납입액

    @JsonProperty("totalInterest")
    private BigDecimal totalInterest;     // 총 이자

    @JsonProperty("maxLimit")
    private BigDecimal maxLimit;          // 계산상 최대 한도

    @JsonProperty("usedLtv")
    private Integer usedLtv;              // 담보계열일 때 사용 LTV

    @JsonProperty("calcTrace")
    private Map<String, String> calcTrace; // 디버그/설명용
}
