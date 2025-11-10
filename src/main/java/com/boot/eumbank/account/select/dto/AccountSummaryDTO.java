package com.boot.eumbank.account.select.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AccountSummaryDTO {
    @JsonProperty("a_no")           private int aNo;           // 계좌no
    @JsonProperty("a_id")           private String aId;
    @JsonProperty("a_account_no")   private String accountNo;    // 계좌번호
    @JsonProperty("a_product_code") private String productCode;         // 상품 코드 또는 입출금에선 대출표현
    @JsonProperty("a_account_type") private String accountType;      // 상품타입
    @JsonProperty("a_currency")     private String currency;        // 계좌 통화
    @JsonProperty("a_balance")      private BigDecimal balance;
    @JsonProperty("a_nickname")     private String nickname;  // 잔액
    @JsonProperty("a_status")       private String status;      // 별칭
    @JsonProperty("lastTransferAt") private LocalDateTime lastTransferAt;       // 최근거래일
}