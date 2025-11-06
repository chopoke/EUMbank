package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;

public interface DashboardService {

    public AssetSummaryDto getDashboardSummary(int cNo);
}
