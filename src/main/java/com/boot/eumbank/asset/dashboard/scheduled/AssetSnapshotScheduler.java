package com.boot.eumbank.asset.dashboard.scheduled;

import com.boot.eumbank.asset.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class AssetSnapshotScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AssetSnapshotScheduler.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final DashboardService dashboardService;

    /**
     *  매일 05:00 KST 스케줄 실행
     */
    @Scheduled(cron = "0 0 20 * * *", zone = "Asia/Seoul")
    public void runDailySnapshot() {
        LocalDate todayKst = LocalDate.now(KST);
        logger.info("<<< AssetSnapshotScheduler dailySnapshot : {} >>>", todayKst);
        dashboardService.takeDailySnapshot(todayKst);
    }
}
