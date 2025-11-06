package com.boot.eumbank.loan.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 대출 안내문 텍스트에서 인지세/국민주택채권/질권수수료/보증료/화재보험 문구를 간단히 추출하는 단일 유틸 */
public final class FeeTextParser {

    private FeeTextParser() {}

    // ---------- 정규식 패턴 ----------
    // 인지세: "인지세 : 해당세액의 50% (대출금액 5천만원 이하시 없음)"
    private static final Pattern STAMP = Pattern.compile(
            "(?:인지세|인지대)\\s*[:\\-]?\\s*(?:해당\\s*세액의\\s*)?(?<rate>\\d{1,3}(?:\\.\\d+)?)\\s*%.*?" +
                    "(?:(?:\\(|\\s)(?:대출금(?:액)?\\s*)?(?<thresh>(?:\\d{1,3}(?:,\\d{3})*|\\d+)(?:천만|억)?원?)\\s*(?:이하|미만)\\s*시?\\s*없음\\)?)?",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // 국민주택채권 매입: "대출금액 * 110% * 1% * 채권할인율" 혹은 "110 ~ 120%"
    private static final Pattern BOND = Pattern.compile(
            "국민주택채권(?:매입|매입비용|매입비)\\s*[:\\-]?\\s*" +
                    "(?:(?<basis>대출금(?:액)?|근저당권\\s*설정금액)\\s*\\*?\\s*)?" +
                    "(?:(?<r1>1(?:10|15|20))\\s*%?\\s*[~\\-]\\s*(?<r2>120)\\s*%|(?<mult>1(?:10|15|20))\\s*%)" +
                    "\\s*\\*\\s*(?<fixed>1)\\s*%?\\s*\\*\\s*(?<disc>채권할인율)",
            Pattern.CASE_INSENSITIVE
    );

    // 질권설정통지수수료: "질권설정통지수수료 :30,000원"
    private static final Pattern PLEDGE_FEE = Pattern.compile(
            "질권설정통지(?:수수료)?\\s*[:\\-]?\\s*(?<won>\\d{1,3}(?:,\\d{3})*|\\d+)\\s*원"
    );

    // 보증료: "주택금융보증료 : 연 0.12% ~ 0.40%" / "주택신보출연료"
    private static final Pattern GUARANTEE = Pattern.compile(
            "(?:주택금융보증료|주택신보출연료)[^\\d%]*(?:연\\s*)?(?<min>\\d+(?:\\.\\d+)?)\\s*%\\s*[~\\-]\\s*(?<max>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // 화재보험료: "화재보험료 : 아파트 외 물건지에 한함"
    private static final Pattern FIRE = Pattern.compile(
            "화재보험료(?::\\s*)?(?<scope>[^;\\n]+)?",
            Pattern.CASE_INSENSITIVE
    );

    // ---------- 공개 메서드: 항목별 개별 파서 ----------
    public static Optional<Double> parseStampTaxRatePct(String text) {
        String s = normalize(text);
        Matcher m = STAMP.matcher(s);
        if (m.find()) return optD(m.group("rate"));
        return Optional.empty();
    }

    /** 인지세 면제 기준 금액(원). 예: "5천만원" -> 50,000,000 */
    public static Optional<Long> parseStampTaxExemptUnderWon(String text) {
        String s = normalize(text);
        Matcher m = STAMP.matcher(s);
        if (m.find()) {
            String t = m.group("thresh");
            if (t != null) return Optional.of(parseKoMoneyToWon(t));
        }
        return Optional.empty();
    }

    /** 국민주택채권 기준(대출금액/근저당권 설정금액) */
    public static Optional<String> parseBondBasis(String text) {
        String s = normalize(text);
        Matcher m = BOND.matcher(s);
        if (m.find()) {
            String basis = m.group("basis");
            return Optional.ofNullable(basis == null ? "대출금액" : basis.replaceAll("\\s+", ""));
        }
        return Optional.empty();
    }

    /** 국민주택채권 곱(단일 값 110/115/120 %) */
    public static Optional<Double> parseBondMultiplierPct(String text) {
        String s = normalize(text);
        Matcher m = BOND.matcher(s);
        if (m.find() && m.group("mult") != null) return optD(m.group("mult"));
        return Optional.empty();
    }

    /** 국민주택채권 범위(예: 110~120%) */
    public static Optional<double[]> parseBondRangePct(String text) {
        String s = normalize(text);
        Matcher m = BOND.matcher(s);
        if (m.find() && m.group("r1") != null) {
            return Optional.of(new double[]{parseD(m.group("r1")), parseD(m.group("r2"))});
        }
        return Optional.empty();
    }

    /** 질권설정통지 수수료(원) */
    public static Optional<Integer> parsePledgeNoticeFeeWon(String text) {
        String s = normalize(text);
        Matcher m = PLEDGE_FEE.matcher(s);
        if (m.find()) return Optional.of(Integer.parseInt(m.group("won").replaceAll(",", "")));
        return Optional.empty();
    }

    /** 보증료 범위(%/연) */
    public static Optional<double[]> parseGuaranteeFeePctPerYear(String text) {
        String s = normalize(text);
        Matcher m = GUARANTEE.matcher(s);
        if (m.find()) return Optional.of(new double[]{parseD(m.group("min")), parseD(m.group("max"))});
        return Optional.empty();
    }

    /** 화재보험료 문구 존재/범위 설명 */
    public static Optional<String> parseFireInsuranceScope(String text) {
        String s = normalize(text);
        Matcher m = FIRE.matcher(s);
        if (m.find()) {
            String scope = m.group("scope");
            return Optional.ofNullable(scope == null ? "" : scope.trim());
        }
        return Optional.empty();
    }

    // ---------- 종합 파서: Map으로 한 번에 반환 (DTO 없이 사용) ----------
    public static Map<String, Object> parseAll(String text) {
        Map<String, Object> out = new LinkedHashMap<>();

        parseStampTaxRatePct(text).ifPresent(v -> out.put("stampTax.ratePct", v));
        parseStampTaxExemptUnderWon(text).ifPresent(v -> out.put("stampTax.exemptUnderWon", v));

        parseBondBasis(text).ifPresent(v -> out.put("bondPurchase.basis", v));
        parseBondMultiplierPct(text).ifPresent(v -> out.put("bondPurchase.multiplierPct", v));
        parseBondRangePct(text).ifPresent(r -> out.put("bondPurchase.rangePct", r));
        // 고정 1% + 채권할인율은 문구상 상수/변수라 필요 시 하드코딩으로 노출
        if (containsBond(text)) {
            out.put("bondPurchase.fixedPct", 1.0);
            out.put("bondPurchase.discountVar", "채권할인율");
        }

        parsePledgeNoticeFeeWon(text).ifPresent(v -> out.put("pledgeNoticeFeeWon", v));
        parseGuaranteeFeePctPerYear(text).ifPresent(r -> out.put("guaranteeFeePctPerYear", r));
        parseFireInsuranceScope(text).ifPresent(scope -> {
            out.put("fireInsurance.applies", true);
            if (!scope.isBlank()) out.put("fireInsurance.scope", scope);
        });

        return out;
    }

    private static boolean containsBond(String text) {
        return BOND.matcher(normalize(text)).find();
    }

    // ---------- 유틸 ----------
    private static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw;
        s = s.replace('％', '%');
        s = s.replace('×', '*').replace('X', '*').replace('x', '*');
        s = s.replaceAll("\\s+", " ").trim();
        s = s.replace("인지대", "인지세");
        s = s.replace("근저당 설정금액", "근저당권 설정금액");
        return s;
    }

    /** "5천만원"/"3억원"/"30,000,000원" 등을 원 단위 숫자로 */
    private static long parseKoMoneyToWon(String t) {
        String s = t.replaceAll(",", "").replaceAll("\\s+", "");
        if (s.matches("\\d+원?")) return Long.parseLong(s.replaceAll("[^0-9]", ""));
        if (s.contains("천만")) {
            long n = Long.parseLong(s.replaceAll("[^0-9]", ""));
            return n * 10_000_000L;
        }
        if (s.contains("억")) {
            long n = Long.parseLong(s.replaceAll("[^0-9]", ""));
            return n * 100_000_000L;
        }
        return Long.parseLong(s.replaceAll("[^0-9]", ""));
    }

    private static Optional<Double> optD(String s) { return s == null ? Optional.empty() : Optional.of(parseD(s)); }
    private static double parseD(String s) { return Double.parseDouble(s); }

}
