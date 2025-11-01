// src/main/java/com/boot/eumbank/loan/util/LtvParser.java
package com.boot.eumbank.loan.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 원문에서 '%/％'가 붙은 값만 추출해서 LTV%를 구함 (예: '70%', '80％') */
public final class LtvParser {

    private static final Pattern PCT = Pattern.compile("(\\d{1,3}(?:\\.\\d+)?)\\s*[%％]");

    private LtvParser() {}

    /** 원문에서 %가 붙은 수치만 스캔해 (0~100) 범위의 최댓값을 정수로 반환 */
    public static Optional<Integer> parseLtvPercent(String s) {
        if (s == null) return Optional.empty();
        String t = s.replaceAll("\\s+", " ").trim();
        if (t.isEmpty()) return Optional.empty();

        Matcher m = PCT.matcher(t);
        Double best = null;
        while (m.find()) {
            try {
                double v = Double.parseDouble(m.group(1)); // 70, 80.5 등
                if (v >= 0 && v <= 100) {
                    if (best == null || v > best) best = v;
                }
            } catch (NumberFormatException ignored) {}
        }
        if (best == null) return Optional.empty();
        return Optional.of((int) Math.round(best));
    }
}
