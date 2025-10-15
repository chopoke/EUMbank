package com.boot.eumbank.foreign.service;

import com.boot.eumbank.foreign.infra.EximClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class FxRateService {

    private final EximClient exim;

    // key: USD/JPY..., value: 기준환율
    private final Map<String, BigDecimal> dealBaseRates = new ConcurrentHashMap<>();

    /** 10분마다 환율 캐시 갱신 (상품 미사용) */
    @Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")
    public void refreshRates() {
        try {
            var rows = exim.fetchToday();
            int updated = 0;
            for (var r : rows) {
                if (r.curUnit != null && r.dealBasR != null) {
                    dealBaseRates.put(r.curUnit, r.dealBasR);
                    updated++;
                }
            }
            log.info("[FX] cached {} currency rates", updated);
        } catch (Exception e) {
            log.error("[FX] refresh failed", e);
        }
    }

    /** 현재 캐시된 기준환율 조회 (없으면 null) */
    public BigDecimal getDealBaseRate(String curUnit) {
        return dealBaseRates.get(curUnit);
    }
}

