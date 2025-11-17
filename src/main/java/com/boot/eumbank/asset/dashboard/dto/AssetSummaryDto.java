package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record AssetSummaryDto(
        BigDecimal totalAssets,         // 총자산
        BigDecimal totalLiabilities,    // 총부채
        BigDecimal netWorth,            // 순자산 = 총자산 - 총부채
        BigDecimal monthlyDue,          // 이번달 납입 예정액(적금, 공과금, 대출)
        List<AssetCompositionDto> composition   // 자산 구성 비율
) {}
