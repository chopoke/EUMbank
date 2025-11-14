// src/main/java/com/boot/eumbank/loan/util/LoanLimitParser.java
package com.boot.eumbank.loan.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LTV/한도 문구 파서 (단일 파일, DTO 없이 Map 반환)
 */
public final class LoanLimitParser {
    private LoanLimitParser(){}

    // ---------- 패턴들 ----------

    // LTV 단독: "LTV 70%", "LTV 최대 80%", "담보인정비율(LTV) 최대 70%"
    private static final Pattern LTV_SIMPLE = Pattern.compile(
            "(?:LTV|담보인정비율\\s*\\(\\s*LTV\\s*\\))\\s*(?:최대\\s*)?(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // 기준 + 퍼센트: "감정가액 x LTV 70%", "감정가의 70%이내", "임차보증금의 80% 범위내"
    private static final Pattern LTV_BASIS = Pattern.compile(
            "(?<basis>감정가(?:액)?|담보평가금액|임차보증금)\\s*(?:의|x|×|X)?\\s*(?:담보인정비율\\s*\\(\\s*LTV\\s*\\)\\s*)?(?<pct>\\d+(?:\\.\\d+)?)\\s*%\\s*(?:이내|범위내)?",
            Pattern.CASE_INSENSITIVE
    );

    // 시나리오별 한도: "신규 - 최대 2억원", "대환 - 최대 10억원"
    private static final Pattern SCENARIO_CAP = Pattern.compile(
            "(?<label>신규|대환|구입자금|임차자금)\\s*[-–—]?\\s*최대\\s*(?<amt>[\\d.,]+(?:\\s*억\\s*[\\d,]+\\s*만원)?|[\\d.,]+\\s*(?:억원|백만원|만원|원))",
            Pattern.CASE_INSENSITIVE
    );

    // 일반 한도: "최대 5억원", "최고 444백만원", "1,500백만원", "440백만원", "4억 4,000만원", "10억원 이내"
    private static final Pattern ABSOLUTE_CAP = Pattern.compile(
            "(?:최대|최고|한도|상한)?\\s*:?\\s*(?<amt>(?:[\\d.,]+\\s*억\\s*[\\d,]+\\s*만원)|(?:[\\d.,]+\\s*(?:억원|백만원|만원|원)))\\s*(?:이내)?",
            Pattern.CASE_INSENSITIVE
    );

    // 독립 숫자+단위만 있는 라인까지 잡기: "444백만원", "5억원", "500백만원"
    private static final Pattern STANDALONE_AMOUNT = Pattern.compile(
            "^(?<amt>(?:[\\d.,]+\\s*억\\s*[\\d,]+\\s*만원)|(?:[\\d.,]+\\s*(?:억원|백만원|만원|원)))$",
            Pattern.CASE_INSENSITIVE
    );

    // 지역 등에 따른 LTV 최대 … 문구
    private static final Pattern LTV_CONDITIONAL = Pattern.compile(
            "(지역|조건|KB시세|아파트).*?(?:LTV).*?(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // ---------- 공개: 한 번에 파싱 ----------
    public static Map<String,Object> parseAll(String raw){
        String s = normalize(raw);
        Map<String,Object> out = new LinkedHashMap<>();

        // 1) LTV(%) 수집
        Set<Double> ltvPcts = new LinkedHashSet<>();
        Matcher m1 = LTV_SIMPLE.matcher(s);
        while (m1.find()) ltvPcts.add(toD(m1.group("pct")));

        Matcher m2 = LTV_BASIS.matcher(s);
        while (m2.find()) {
            double pct = toD(m2.group("pct"));
            ltvPcts.add(pct);
            Map<String,Object> item = new LinkedHashMap<>();
            item.put("basis", m2.group("basis")); // 감정가액/담보평가금액/임차보증금
            item.put("pct", pct);
            append(out, "ltvBasis", item);
        }

        Matcher m3 = LTV_CONDITIONAL.matcher(s);
        while (m3.find()) ltvPcts.add(toD(m3.group("pct")));

        if (!ltvPcts.isEmpty()){
            out.put("ltvPcts", new ArrayList<>(ltvPcts));
            out.put("ltvMaxPct", ltvPcts.stream().mapToDouble(Double::doubleValue).max().orElse(0));
        }

        // 2) 시나리오별 한도
        Matcher sc = SCENARIO_CAP.matcher(s);
        while (sc.find()){
            long won = parseKoMoneyToWon(sc.group("amt"));
            Map<String,Object> item = new LinkedHashMap<>();
            item.put("scenario", sc.group("label")); // 신규/대환/…
            item.put("capWon",  won);
            append(out, "scenarioCaps", item);
        }

        // 3) 절대 한도(일반)
        List<Long> caps = new ArrayList<>();
        Matcher ac = ABSOLUTE_CAP.matcher(s);
        while (ac.find()){
            String amt = ac.group("amt");
            if (amt == null || amt.isBlank()) continue;
            long won = parseKoMoneyToWon(amt);
            if (won > 0) {
                caps.add(won);
                append(out, "capsAll", won);
            }
        }

        // 라인 전체가 금액만 있는 경우도 포착
        for (String line : s.split("\\n")){
            Matcher sa = STANDALONE_AMOUNT.matcher(line.trim());
            if (sa.find()){
                long won = parseKoMoneyToWon(sa.group("amt"));
                if (won > 0){
                    caps.add(won);
                    append(out, "capsAll", won);
                }
            }
        }

        if (!caps.isEmpty()){
            out.put("capMaxWon", caps.stream().mapToLong(Long::longValue).max().orElse(0));
            out.put("capMinWon", caps.stream().mapToLong(Long::longValue).min().orElse(0));
        }

        // 4) 자유서술 한도(“담보평가금액에 따라 산출된 가능금액” 등) 탐지 플래그
        if (s.contains("담보평가금액") && s.contains("가능금액"))
            out.put("capDependsOnAppraisal", true);

        return out;
    }
    // "4억 4,000만원" / "4.44억원" / "444백만원" / "1,500백만원" / "5억원" / "500만원" / "10억원"
    private static long parseKoMoneyToWon(String amt){
        if (amt == null) return 0L;
        String s = amt.replaceAll("\\s+", " ").trim();

        // 1) "N억 M만원"
        Matcher em = Pattern.compile("(?<e>[\\d.,]+)\\s*억\\s*(?<m>[\\d,]+)\\s*만원").matcher(s);
        if (em.find()){
            long e = toLong(em.group("e").replaceAll(",", ""));
            long m = toLong(em.group("m").replaceAll(",", ""));
            return e * 100_000_000L + m * 10_000L;
        }

        // 2) "N억원"
        Matcher eOnly = Pattern.compile("(?<e>[\\d.,]+)\\s*억원").matcher(s);
        if (eOnly.find()){
            double e = toD(eOnly.group("e"));
            return Math.round(e * 100_000_000L);
        }

        // 3) "N백만원" (1백만원 = 1,000,000원)
        Matcher baek = Pattern.compile("(?<b>[\\d.,]+)\\s*백만원").matcher(s);
        if (baek.find()){
            double b = toD(baek.group("b"));
            return Math.round(b * 1_000_000L);
        }

        // 4) "N만원" / "N원"
        Matcher man = Pattern.compile("(?<m>[\\d.,]+)\\s*만원").matcher(s);
        if (man.find()){
            long m = toLong(man.group("m").replaceAll(",", ""));
            return m * 10_000L;
        }
        Matcher won = Pattern.compile("(?<w>[\\d.,]+)\\s*원").matcher(s);
        if (won.find()){
            return toLong(won.group("w").replaceAll(",", ""));
        }

        // 5) 쉼표 포함 숫자만 온 경우(보수적으로 원으로 해석 X) → 0
        return 0L;
    }

    // LTV %를 파싱하기 위해 (ex 70%)
    public static Optional<Integer> parseLtvPercent(String s) {
        if (s == null) return Optional.empty();
        Matcher m = PCT.matcher(s.replaceAll("\\s+"," ").trim());
        Double best = null;
        while (m.find()) {
            double v = Double.parseDouble(m.group(1));
            if (v >= 0 && v <= 100) best = (best == null || v > best) ? v : best;
        }
        return best == null ? Optional.empty() : Optional.of((int)Math.round(best));
    }

    // 최대금액을 파싱하기 위해서 (ex 10억원)
    public static Optional<Long> parseAbsoluteWon(String s){
        if (s == null || s.isBlank()) return Optional.empty();
        String norm = s.replaceAll("\\s+"," ");

        long best = 0L;

        // 1) "4억 4,000만원" / "2.2억 300만원"
        Matcher m1 = EOK_MAN.matcher(norm);
        while (m1.find()){
            double eok = toDouble(m1.group(1));      // 억
            long man   = toLong(m1.group(2));        // 만원
            long won = (long)Math.round(eok * 100_000_000L) + man * 10_000L;
            if (won > best) best = won;
        }

        // 2) "5억원" / "2.2억"
        Matcher m2 = ONLY_EOK.matcher(norm);
        while (m2.find()){
            double eok = toDouble(m2.group(1));
            long won = (long)Math.round(eok * 100_000_000L);
            if (won > best) best = won;
        }

        // 3) "300만원"
        Matcher m3 = ONLY_MAN.matcher(norm);
        while (m3.find()){
            long man = toLong(m3.group(1));
            long won = man * 10_000L;
            if (won > best) best = won;
        }

        // 4) "444백만원" / "1,500백만원"
        Matcher m4 = BAEK_MANWON.matcher(norm);
        while (m4.find()){
            long baekMan = toLong(m4.group(1)); // '백만원' 단위 수치
            long won = baekMan * 1_000_000L;    // 1 백만원 = 1,000,000원
            if (won > best) best = won;
        }

        return best <= 0 ? Optional.empty() : Optional.of(best);
    }

    // ---------- 유틸 ----------

    private static final Pattern PCT = Pattern.compile("(\\d{1,3}(?:\\.\\d+)?)\\s*[%％]");

    private static String normalize(String raw){
        if (raw == null) return "";
        String s = raw
                .replace('％','%')
                .replace('＋','+')
                .replace('×','x')
                .replace('：',':')
                .replaceAll("\\s+"," ")
                .replaceAll("(?i)담보인정비율\\(LTV\\)\\s*:", "담보인정비율(LTV) ")
                .trim();
        return s;
    }

    private static double toD(String s){
        if (s == null) return 0d;
        String t = s.replaceAll("[^0-9.]", "");
        return t.isEmpty()?0d:Double.parseDouble(t);
    }
    private static long toLong(String s){
        if (s == null) return 0L;
        String t = s.replaceAll("[^0-9]", "");
        return t.isEmpty()?0L:Long.parseLong(t);
    }
    private static double toDouble(String x){
        if (x == null) return 0d;
        return Double.parseDouble(x.replace(",", ""));
    }

    @SuppressWarnings("unchecked")
    private static void append(Map<String,Object> out, String key, Object v){
        ((List<Object>) out.computeIfAbsent(key, k -> new ArrayList<>())).add(v);
    }
    // 억/만원 조합: "4억 4,000만원", "2.2억 300만원", "10억원" 등
    private static final Pattern EOK_MAN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*억\\s*(?:([\\d,]+)\\s*만\\s*원?)?"
    );
    // 억만/만원 단독: "5억원", "300만원", "2.2억"
    private static final Pattern ONLY_EOK = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*억\\s*원?");
    private static final Pattern ONLY_MAN = Pattern.compile("([\\d,]+)\\s*만\\s*원?");
    // 백만원 단위: "444백만원", "1,500백만원"
    private static final Pattern BAEK_MANWON = Pattern.compile("([\\d,]+)\\s*백\\s*만\\s*원?");





    // 데모
    public static void main(String[] args){
        String sample = """
            LTV 70% 이내(KB시세 확인 가능한 아파트만 가능)
            감정가액 x 담보인정비율(LTV) 70% 이내
            지역에 따라 담보인정비율(LTV) 최대 80% 이내
            LTV 최대 70%, 신규 - 최대 2억원, 대환 - 최대 10억원
            최저 5백만원, 최고 5억원 이내
            최대 4억 4,000만원 / 최대444백만원 / 1,500백만원 / 10억원 이내
        """;
        Map<String,Object> m = parseAll(sample);
        m.forEach((k,v)-> System.out.println(k+" = "+v));
    }
}
