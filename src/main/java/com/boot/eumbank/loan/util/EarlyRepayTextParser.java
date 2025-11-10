package com.boot.eumbank.loan.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 중도상환 수수료/해약금 문구 파서
 *   => loan_product_tbl : lpd_erly_rpay_fee 컬럼 원본파싱
 * - 공식: 중도상환금액 * 요율 * (대출잔여일수 / {대출기간|3년})
 * - 고정/변동 각 요율, 단일 요율, '취급 후 N년 이내' 특약, 'N년 경과 시 면제', '연간 면제한도' 등을 추출.
 * - DTO없이 Map으로 반환
 */
public final class EarlyRepayTextParser {

    private EarlyRepayTextParser() {}

    // ====== 정규식 패턴 ======
    // 동의어 정규화: 수수료/해약금, 잔여일수/잔존기간/잔존일수/경과일수 등
    private static final String AMOUNT = "(?:중도상환(?:원금|대출금액|금액))";
    private static final String DAYS_LEFT = "(?:대출잔여일수|잔존기간|잔존일수|대출기간\\s*-\\s*경과일수)";
    private static final String TERM = "(?:대출기간|3년|최장\\s*3년)";
    private static final Pattern FORMULA_CORE = Pattern.compile(
            AMOUNT + ".*?(?:수수료|해약금|수수요율|적용요율|요율|해약금률).*?" +
                    "\\((?:" + DAYS_LEFT + ")\\s*[÷/]\\s*(?:" + TERM + ")\\)",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // 고정/변동 요율 묶음: "고정금리 0.74%, 변동금리 0.66%" 등
    private static final Pattern FIX_VAR = Pattern.compile(
            "고정금리\\s*(?<fix>\\d+(?:\\.\\d+)?)\\s*%\\s*,?\\s*변동금리\\s*(?<var>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // 요율만 단일로: "0.58%", "1.3%" 등 (가장 큰 값을 대표값으로)
    private static final Pattern ANY_PCT = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%");

    // 범위/캡: "대출기간이 3년을 초과하는 경우 3년", "최장 3년", "(3년-대출경과일수)/3년"
    private static final Pattern CAP_3Y = Pattern.compile(
            "(3\\s*년(?:\\s*을\\s*초과하는\\s*경우\\s*3\\s*년|\\s*경과시\\s*면제|)|최장\\s*3\\s*년)",
            Pattern.CASE_INSENSITIVE
    );

    // 면제 규칙
    private static final Pattern EXEMPT_AFTER_YEARS = Pattern.compile(
            "(?:취급|대출\\s*실행).*?(?<years>\\d+)\\s*년.*?(?:이후|경과시)\\s*면제",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern EXEMPT_NONE = Pattern.compile("\\b없음\\b");

    // '취급 후 N년 이내 0.66%' / '3년 이내 상환시 0.5%'
    private static final Pattern WITHIN_N_YEARS = Pattern.compile(
            "(?:취급|대출).*?(?<years>\\d+)\\s*년\\s*이내.*?(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // 연간 면제 한도: "매년 대출잔액의 10% 까지 면제"
    private static final Pattern ANNUAL_FREE = Pattern.compile(
            "매년\\s*(?:대출잔액|상환원금)의\\s*(?<pct>\\d+(?:\\.\\d+)?)\\s*%\\s*까지\\s*면제"
    );

    // 분모가 3년인지(=기간 캡) / 대출기간인지 식별
    private static final Pattern DENOM_3Y = Pattern.compile("[÷/]\\s*3\\s*년");
    private static final Pattern DENOM_TERM = Pattern.compile("[÷/]\\s*대출기간");

    // ====== 퍼블릭: 한 번에 파싱(Map) ======
    public static Map<String, Object> parseAll(String raw) {
        String s = normalize(raw);
        Map<String, Object> out = new LinkedHashMap<>();

        // 1) 공식 탐지(형태)
        out.put("hasFormula", FORMULA_CORE.matcher(s).find());
        out.put("denominator", detectDenominator(s).orElse("unknown")); // "3년" | "대출기간" | "unknown"
        out.put("capYears", CAP_3Y.matcher(s).find() ? 3 : null); // 3년 캡 존재 여부

        // 2) 요율들
        Matcher fx = FIX_VAR.matcher(s);
        if (fx.find()) {
            out.put("rate.fixedPct",    parseD(fx.group("fix")));
            out.put("rate.variablePct", parseD(fx.group("var")));
        }

        // 단일 요율 후보(여러 개면 최댓값을 대표값으로)
        OptionalDouble flat = ANY_PCT.matcher(s).results()
                .mapToDouble(r -> parseD(r.group(1))).max();
        flat.ifPresent(v -> out.put("rate.flatPct", v));

        // '취급 후 N년 이내 x%' 특약
        Matcher wy = WITHIN_N_YEARS.matcher(s);
        while (wy.find()) {
            Map<String,Object> rule = new HashMap<>();
            rule.put("withinYears", parseI(wy.group("years")));
            rule.put("pct",         parseD(wy.group("pct")));
            appendList(out, "rate.specialWithinYears", rule);
        }

        // 3) 면제 규칙
        if (EXEMPT_NONE.matcher(s).find()) out.put("exempt.none", true);
        Matcher ex = EXEMPT_AFTER_YEARS.matcher(s);
        if (ex.find()) {
            out.put("exempt.afterYears", parseI(ex.group("years")));
        }

        // 4) 연간 면제한도
        Matcher af = ANNUAL_FREE.matcher(s);
        if (af.find()) {
            out.put("annualFreeAllowancePct", parseD(af.group("pct")));
        }

        return out;
    }

    // ====== 퍼블릭: 항목별 단독 메서드 (원하면 개별 호출) ======
    public static Optional<String> detectDenominator(String text) {
        String s = normalize(text);
        if (DENOM_3Y.matcher(s).find()) return Optional.of("3년");
        if (DENOM_TERM.matcher(s).find()) return Optional.of("대출기간");
        return Optional.of("unknown");
    }
    public static OptionalDouble parseFixedRatePct(String text) {
        String s = normalize(text);
        Matcher m = FIX_VAR.matcher(s);
        if (m.find()) return OptionalDouble.of(parseD(m.group("fix")));
        return OptionalDouble.empty();
    }
    public static OptionalDouble parseVariableRatePct(String text) {
        String s = normalize(text);
        Matcher m = FIX_VAR.matcher(s);
        if (m.find()) return OptionalDouble.of(parseD(m.group("var")));
        return OptionalDouble.empty();
    }
    public static OptionalDouble parseMaxFlatRatePct(String text) {
        String s = normalize(text);
        return ANY_PCT.matcher(s).results().mapToDouble(r -> parseD(r.group(1))).max();
    }
    public static OptionalInt parseExemptAfterYears(String text) {
        String s = normalize(text);
        Matcher m = EXEMPT_AFTER_YEARS.matcher(s);
        if (m.find()) return OptionalInt.of(Integer.parseInt(m.group("years")));
        return OptionalInt.empty();
    }
    public static OptionalDouble parseAnnualFreePct(String text) {
        String s = normalize(text);
        Matcher m = ANNUAL_FREE.matcher(s);
        if (m.find()) return OptionalDouble.of(parseD(m.group("pct")));
        return OptionalDouble.empty();
    }

    // ====== 내부 유틸 ======
    private static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw;
        // 곱/나눗셈 기호 통일
        s = s.replace('×', '*').replace('X', '*').replace('x', '*');
        s = s.replace('％', '%');
        // 공백 축약
        s = s.replaceAll("\\s+", " ").trim();
        // 흔한 오타/동의어
        s = s.replace("수수요율", "수수료율"); // 오타 흡수
        s = s.replace("잔존기간", "대출잔여일수");
        s = s.replace("잔존일수", "대출잔여일수");
        s = s.replace("잔존 기간", "대출잔여일수");
        s = s.replace("경과기간", "경과일수");
        s = s.replace("수수료(율", "수수료율(");
        return s;
    }

    // ============ 유틸
    private static int parseI(String s) {
        if (s == null) return 0;
        String t = s.replaceAll("[^0-9]", "");
        return t.isEmpty() ? 0 : Integer.parseInt(t);
    }

    private static double parseD(String s) {
        if (s == null) return 0d;
        String t = s.replaceAll("[^0-9.]", ""); // 0.58% 같은 케이스
        return t.isEmpty() ? 0d : Double.parseDouble(t);
    }
    private static int safeParseInt(String s) {
        if (s == null) return 0;
        String t = s.replaceAll("[^0-9]", ""); // 혹시 '3년' 같이 붙어온 경우 대비
        return t.isEmpty() ? 0 : Integer.parseInt(t);
    }
    @SuppressWarnings("unchecked")
    private static void appendList(Map<String,Object> out, String key, Object v) {
        ((List<Object>) out.computeIfAbsent(key, k -> new ArrayList<>())).add(v);
    }

    // ====== 사용 예 ======
    public static void main(String[] args) {
        String sample = """
            중도상환수수료(대출취급 후 3년 경과시 면제)
            = 중도상환대출금액X중도상환수수료율 X(대출잔여일수÷대출기간)
            2)중도상환수수료율 = 취급후 3년 이내 상환시 0.5%
            중도상환금액 X 중도상환수수료율(고정금리 0.69%, 변동금리 0.66%) X (대출잔여일수 ÷ 대출기간*)
            *대출기간이 3년을 초과하는 경우 3년
            매년 대출잔액의 10% 까지 중도상환수수료 면제
        """;

        Map<String,Object> m = parseAll(sample);
        m.forEach((k,v)-> System.out.println(k + " = " + (v instanceof List<?> l ? l.toString() : v)));
    }
}
