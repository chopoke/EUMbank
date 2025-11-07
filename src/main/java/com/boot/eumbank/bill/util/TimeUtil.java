package com.boot.eumbank.bill.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public final class TimeUtil {
    private TimeUtil(){}
    public static LocalDateTime dayStart(LocalDate d){ return d.atStartOfDay(); }
    public static LocalTime parseHms(String s){
        if (s==null || s.isBlank()) return null;
        return LocalTime.parse(s); // "HH:MM:SS"
    }
}
