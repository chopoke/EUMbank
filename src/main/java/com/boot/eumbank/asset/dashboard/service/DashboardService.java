package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;

import java.time.LocalDate;

public interface DashboardService {

    AssetSummaryDto getDashboardSummary(int cNo);
    void takeDailySnapshot(LocalDate ymd);
}
