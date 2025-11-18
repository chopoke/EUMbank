package com.boot.eumbank.spot.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotUserHoldingsDTO {
    private Long customerNo;
    private String userId;
    private BigDecimal gold;
    private BigDecimal silver;
}

