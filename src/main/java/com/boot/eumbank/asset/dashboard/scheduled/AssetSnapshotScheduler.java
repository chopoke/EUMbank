package com.boot.eumbank.asset.dashboard.scheduled;

import com.boot.eumbank.asset.dashboard.repository.DashboardRepository;
import com.boot.eumbank.asset.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
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
    private final DashboardRepository dashboardRepository;

    /**
     *  매일 05:00 KST 스케줄 실행
     */
    @Scheduled(cron = "0 0 5 * * *", zone = "Asia/Seoul")
    public void runDailySnapshot() {
        LocalDate todayKst = LocalDate.now(KST);
        logger.info("<<< AssetSnapshotScheduler dailySnapshot : {} >>>", todayKst);
        dashboardService.takeDailySnapshot(todayKst);
    }

    @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void backfillOnStartup() {
        LocalDate today = LocalDate.now(KST);
        LocalDate last = dashboardRepository.getLastSnapshotDate().orElse(null);

        // last가 없으면 오늘만, 있으면 (last+1)부터 today까지
        LocalDate start = (last == null) ? today : last.plusDays(1);
        if (start.isAfter(today)) {
            logger.info("<<< 스냅샷 백필 없음 (마지막={}, today={}) >>>", last, today);
            return;
        }

        for (LocalDate d = start; !d.isAfter(today); d = d.plusDays(1)) {
            try {
                logger.info("<<< 부트스트랩 백필 실행: {} >>>", d);
                dashboardService.takeDailySnapshot(d);
            } catch (Exception e) {
                logger.warn("<<< 백필 실패 date={}: {} >>>", d, e.getMessage(), e);
            }
        }
    }
}
