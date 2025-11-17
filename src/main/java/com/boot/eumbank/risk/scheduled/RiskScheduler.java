// src/main/java/com/boot/eumbank/risk/scheduled/RiskScheduler.java
package com.boot.eumbank.risk.scheduled;

import com.boot.eumbank.risk.service.OverdueScanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RiskScheduler {

    private final OverdueScanService overdueScanService;

    /** 연체 스캔 통합 스케줄러 */
    @Scheduled(cron = "0/10 * * * * *") // 너희가 쓰는 cron 그대로 유지/수정
    @Transactional
    public void scanAllOverdues() {

        //  블럭 시작 라인
        log.info("════════════════════════════════════════════════════════════");

        // 각 카테고리별 스캔
        int depositRows = overdueScanService.scanDeposits();
        int savingRows  = overdueScanService.scanSavings();
        int loanRows    = overdueScanService.scanLoans();

        // 요약 로그
        log.info("[RISK] deposit scan rows = {} / saving scan rows = {} / loan scan rows = {}",
                depositRows, savingRows, loanRows);

        //  블럭 끝 라인
        log.info("════════════════════════════════════════════════════════════");
    }
}
