// src/main/java/com/boot/eumbank/mypage/dto/DepositItemDto.java
package com.boot.eumbank.mypage.dto;

import lombok.*;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DepositItemDto {
    private String id;
    private String productName;
    private Integer balance;      // 잔액(d_principal_bal)
    private Integer goalAmount;   // 가입/목표 금액(d_amount)
    private String openedAt;
    private String maturityAt;

    // 예금 상품 스펙(dp_*) 묶어서 전달
    private Map<String, Object> product;
}
