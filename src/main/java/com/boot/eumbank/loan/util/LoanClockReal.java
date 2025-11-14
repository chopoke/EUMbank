package com.boot.eumbank.loan.util;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class LoanClockReal implements LoanClock{
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final LocalDateTime startedAt = LocalDateTime.now(ZONE);
    private final LocalDate baseDate = LocalDate.now(ZONE);

    @Override
    public LocalDate today() {
        long minutes = Duration.between(startedAt, LocalDateTime.now(ZONE)).toMinutes();
        long months = minutes; // 1분 = 1개월
        return baseDate.plusMonths(months);
    }

    @Override
    public LocalDateTime now() {
        LocalDate logical = today();
        LocalDateTime realNow = LocalDateTime.now(ZONE);
        return logical.atTime(realNow.toLocalTime());
    }
}
