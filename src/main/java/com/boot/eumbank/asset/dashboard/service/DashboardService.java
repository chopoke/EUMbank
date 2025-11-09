package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.dto.AssetTrendDto;
import com.boot.eumbank.asset.dashboard.dto.TopSavingsDto;

import java.time.LocalDate;

public interface DashboardService {

    AssetSummaryDto getDashboardSummary(int cNo);
    void takeDailySnapshot(LocalDate ymd);
    AssetTrendDto getNetWorthTrend(int cNo);
    TopSavingsDto getTopSavings(int cNo);
}
