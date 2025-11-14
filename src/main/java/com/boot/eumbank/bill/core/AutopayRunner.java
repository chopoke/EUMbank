package com.boot.eumbank.bill.core;

import java.time.LocalDateTime;

// 자동이체 스케줄러(임의 연결 포인트, Quartz/스케줄러에 연결)
public interface AutopayRunner {
    int runDueAutopay(LocalDateTime now);
}
