package com.boot.eumbank.bill.batch;

import com.boot.eumbank.bill.core.AutopayRunner;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AutopayScheduler {
    private final AutopayRunner runner;
    // 매일 03:10 실행. 프로필 dev만 사용하고 싶으면 @Profile("dev")
    @Scheduled(cron = "0 10 3 * * *", zone = "Asia/Seoul")
    public void run(){ runner.runDueAutopay(LocalDateTime.now()); }
}
