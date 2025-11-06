package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record AssetCompositionDto(
        String category,        // 입출금, 외화, 적금, 예금, 현물
        BigDecimal amountKrw
) {}
