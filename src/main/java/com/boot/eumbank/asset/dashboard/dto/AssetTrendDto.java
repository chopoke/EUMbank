package com.boot.eumbank.asset.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record AssetTrendDto(
        List<AssetTrendPoint> points,   // 날짜순 정렬(최대 최근 30일)
        BigDecimal dayDelta,            // 전일 대비 (원)
        BigDecimal change30,            // 최근 30일 증감 (원)
        BigDecimal max,                 // 최고값 (원)
        BigDecimal min,                 // 최저값 (원)
        BigDecimal changePct            // 변동폭: (마지막-처음)/처음 * 100 (%)
) {}
