package com.boot.eumbank.loan.util;

import java.util.Optional;
import java.util.regex.Pattern;


/**
 * 주담대 API를 통해 들어온 원문 LTV
 * 숫자만 따서 계산하기 위해
 */
public final class LtvParser {

    private static final Pattern PCT = Pattern.compile("(\\d{1,3}(?:\\.\\d+)?)\\s*[%％]");

    private LtvParser(){}

    /** 원문에서 % 앞 숫자들을 찾아 (1~100 사이) 최댓값을 정수 LTV로 반환 */
    public static Optional<Integer> parseLtvPercent(String s) {
        if (s == null) return Optional.empty();
        String t = s.trim();
        if (t.isEmpty()) return Optional.empty();

        // 숫자만 추출 (첫 번째 숫자 시퀀스)
        String digits = t.replaceAll("[^0-9]", ""); // "최대 70 %" -> "70"
        if (digits.isEmpty()) return Optional.empty();

        try {
            int v = Integer.parseInt(digits);
            // 과도한 값 방지 (0~100 범위로 클램프)
            if (v < 0) v = 0;
            if (v > 100) v = 100;
            return Optional.of(v);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
