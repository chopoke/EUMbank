package com.boot.eumbank.loan.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class LdIdMaker {

    private LdIdMaker(){}

    private static final DateTimeFormatter D8 = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 예: L1234-20251106-0  / 스케줄 있으면 L1234-20251106-987
     */
    public static String make(Long loanNo, LocalDate calcDate, Long scheduleIdOrNull) {
        long s = (scheduleIdOrNull == null) ? 0L : scheduleIdOrNull;
        return "L" + loanNo + "-" + D8.format(calcDate) + "-" + s;
    }

}
