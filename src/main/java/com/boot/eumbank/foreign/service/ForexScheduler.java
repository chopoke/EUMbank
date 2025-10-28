package com.boot.eumbank.foreign.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ForexScheduler {

    private final FxRateService fxRateService;

    /** 서버 기동 직후 1회 (초기 표시가 '-'로 비는 현상 방지) */
    @EventListener(ApplicationReadyEvent.class)
    public void warmupOnBoot() {
        log.info("[FX] warmup start");
        fxRateService.warmupIfEmpty();
        log.info("[FX] warmup end");
    }

    /** 10분마다 갱신 (매 시각 0,10,20,30,40,50분) */
    @Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")
    public void refreshEvery10m() {
        log.info("[FX] scheduled refresh start");
        int n = fxRateService.refreshRates();
        log.info("[FX] scheduled refresh end, updated={}", n);
    }
}
