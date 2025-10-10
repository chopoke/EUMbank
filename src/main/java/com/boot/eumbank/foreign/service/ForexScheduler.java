// com.boot.eumbank.foreign.service.ForexScheduler.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.foreign.entity.ForeignProduct;
import com.boot.eumbank.foreign.repo.ForeignProductRepository;
import com.boot.eumbank.foreign.infra.EximClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForexScheduler {

    private final EximClient exim;
    private final ForeignProductRepository repo;

    /** 10분마다 갱신 (매 시각 0,10,20,30,40,50분) */
    @Scheduled(cron = "0 */10 * * * *", zone = "Asia/Seoul")
    @Transactional
    public void refreshRates() {
        try {
            var rows = exim.fetchToday();
            int updated = 0;

            for (var r : rows) {
                var list = repo.findByCurUnit(r.curUnit);
                for (ForeignProduct fp : list) {

                    if (r.curNm != null) fp.setCurNm(r.curNm);
                    if (r.ttb != null) fp.setTtb(r.ttb);
                    if (r.tts != null) fp.setTts(r.tts);
                    if (r.dealBasR != null) fp.setDealBasR(r.dealBasR);
                    updated++;
                }

            }
            log.info("[FOREX] refreshed {} rows ({} currencies)", updated, rows.size());
        } catch (Exception e) {
            log.error("[FOREX] refresh failed", e);
        }
    }
}
