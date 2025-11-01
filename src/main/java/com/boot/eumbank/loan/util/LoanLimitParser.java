// src/main/java/com/boot/eumbank/loan/util/LoanLimitParser.java
package com.boot.eumbank.loan.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 상품 원문 한도 문구(예: "최대 4.44억원", "500백만원", "4억 4,000만원", "4억 44백만원")에서
 * 절대 한도(원)를 추출한다.
 *
 * 규칙:
 * - %/％ 표기가 있어도 절대한도(원) 표기가 함께 있으면 끝까지 스캔한다.
 * - 우선순위: (1) 억+만원 혼합 → (2) 억+백만원 혼합 → (3) 억 → (4) 백만원 → (5) 만원 → (6) 원
 */
public final class LoanLimitParser {

    private LoanLimitParser() {}

    private static final Pattern MIXED_EOK_MANWON =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*억\\s*(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*만\\s*원?");
    private static final Pattern MIXED_EOK_BAEK =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*억\\s*(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*백\\s*만\\s*원?");
    private static final Pattern ONLY_EOK =
            Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*억\\s*원?");
    private static final Pattern BAEK_MANWON =
            Pattern.compile("(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*백\\s*만\\s*원?");
    private static final Pattern ONLY_MANWON =
            Pattern.compile("(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*만\\s*원?");
    private static final Pattern ONLY_WON =
            Pattern.compile("(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*원");

    private static long parseNumber(String s) {
        return Long.parseLong(s.replaceAll(",", ""));
    }

    public static Optional<Long> parseAbsoluteWon(String raw) {
        if (raw == null) return Optional.empty();
        String t = raw.replaceAll("\\s+", " ").trim();
        if (t.isEmpty()) return Optional.empty();

        Long best;

        // 1) 억 + 만원 혼합
        best = tryMixedEokMan(t);
        if (best != null) return Optional.of(best);

        // 2) 억 + 백만원 혼합
        best = tryMixedEokBaek(t);
        if (best != null) return Optional.of(best);

        // 3) 억
        Matcher mE = ONLY_EOK.matcher(t);
        while (mE.find()) {
            double eok = Double.parseDouble(mE.group(1));
            long won = Math.round(eok * 100_000_000L);
            best = (best == null) ? won : Math.max(best, won);
        }
        if (best != null) return Optional.of(best);

        // 4) 백만원
        Matcher mB = BAEK_MANWON.matcher(t);
        while (mB.find()) {
            long baek = parseNumber(mB.group(1));
            long won = baek * 1_000_000L;
            best = (best == null) ? won : Math.max(best, won);
        }
        if (best != null) return Optional.of(best);

        // 5) 만원
        Matcher mM = ONLY_MANWON.matcher(t);
        while (mM.find()) {
            long man = parseNumber(mM.group(1));
            long won = man * 10_000L;
            best = (best == null) ? won : Math.max(best, won);
        }
        if (best != null) return Optional.of(best);

        // 6) …원(단위만 원)
        Matcher mW = ONLY_WON.matcher(t);
        while (mW.find()) {
            long won = parseNumber(mW.group(1));
            best = (best == null) ? won : Math.max(best, won);
        }
        return Optional.ofNullable(best);
    }

    private static Long tryMixedEokMan(String t) {
        Matcher m = MIXED_EOK_MANWON.matcher(t);
        Long best = null;
        while (m.find()) {
            double eok = Double.parseDouble(m.group(1));
            long man = parseNumber(m.group(2));
            long won = Math.round(eok * 100_000_000L) + man * 10_000L;
            best = (best == null) ? won : Math.max(best, won);
        }
        return best;
    }

    private static Long tryMixedEokBaek(String t) {
        Matcher m = MIXED_EOK_BAEK.matcher(t);
        Long best = null;
        while (m.find()) {
            double eok = Double.parseDouble(m.group(1));
            long baek = parseNumber(m.group(2));
            long won = Math.round(eok * 100_000_000L) + baek * 1_000_000L;
            best = (best == null) ? won : Math.max(best, won);
        }
        return best;
    }
}
