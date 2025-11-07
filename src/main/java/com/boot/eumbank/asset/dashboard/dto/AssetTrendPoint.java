package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetTrendPoint(
        LocalDate ymd,
        BigDecimal netWorth
) {}
