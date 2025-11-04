package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;

public record AssetCompositionDto(
        String category,        // (입출금), foreign(외화), installment(적금), deposit(예금), gold(현물)
        BigDecimal amountKrw
) {}
