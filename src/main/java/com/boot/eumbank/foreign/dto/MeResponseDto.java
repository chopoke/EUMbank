// com.boot.eumbank.foreign.dto.MeResponseDto
package com.boot.eumbank.foreign.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MeResponseDto {

    @JsonProperty("cNo")                // <-- 프런트가 읽는 키 이름 고정
    private Integer cNo;

    @JsonProperty("preferentialRate")
    private BigDecimal preferentialRate;

    @JsonProperty("accounts")
    private List<AccountSummary> accounts;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AccountSummary {
        private String accountNo;
        private String name;     // 별칭/상품명 등
        private String type;     // KRW / 외화 타입
        private String currency; // "KRW" 등
        private BigDecimal balance;
    }
}
