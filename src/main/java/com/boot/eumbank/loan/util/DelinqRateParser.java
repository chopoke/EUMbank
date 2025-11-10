// src/main/java/com/boot/eumbank/loan/util/DelinqRateParser.java
package com.boot.eumbank.loan.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 연체이자(연체금리) 문구 파서 (단일 파일)
 * - 패턴: (대출금리|적용금리|대출이자율) + 가산%  / 최고(최대) O% 상한 / 특약(기준>=N%면 +M%)
 * - 구간 규칙: "-1개월이내: 대출금리+3%" 등도 수집
 * - 반환: Map<String,Object> (DTO 없이)
 */
public final class DelinqRateParser {
    private DelinqRateParser() {}

    // -------- 정규식 --------
    // 기준 + 가산%
    private static final Pattern BASE_PLUS = Pattern.compile(
            "(?<base>대출금리|적용금리|대출이자율)\\s*\\+\\s*(?:연\\s*)?(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );
    // "대출금리 + 연 3%" 형태까지 수용
    private static final Pattern BASE_PLUS_ALT = Pattern.compile(
            "(?<base>대출금리|적용금리|대출이자율)\\s*\\+\\s*연\\s*(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // 상한(최대/최고 … %)
    private static final Pattern CAP_MAX = Pattern.compile(
            "(?:최고\\s*(?:연체이자율|이자율)?|최대\\s*(?:연)?|연체금리\\s*최고율)\\s*[:：]?(?:\\s*연)?\\s*(?<cap>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // 특약: "대출이자(대출금리)가 연 15% 이상인 경우 연체이자(연) 2% 가산"
    private static final Pattern CONDITIONAL_ADD = Pattern.compile(
            "(?:대출이자(?:가)?|대출금리(?:가)?)\\s*연\\s*(?<thresh>\\d+(?:\\.\\d+)?)\\s*%\\s*(?:이상|초과)[^\\d%]*" +
                    "(?:연체이자|연체금리)?[^\\d%]*연?\\s*(?<add>\\d+(?:\\.\\d+)?)\\s*%\\s*(?:를|을)?\\s*가산",
            Pattern.CASE_INSENSITIVE
    );

    // 구간 규칙: "-1개월이내: 대출금리+3%" / "-3개월초과: 대출금리+3%(최고 15%)"
    private static final Pattern PERIOD_RULE = Pattern.compile(
            "\\-\\s*(?<period>\\d+\\s*개월(?:이내|초과)?)\\s*[:：]\\s*(?<base>대출금리|적용금리|대출이자율)\\s*\\+\\s*(?:연\\s*)?(?<pct>\\d+(?:\\.\\d+)?)\\s*%",
            Pattern.CASE_INSENSITIVE
    );

    // “연체기간에 관계없이 …” 플래그
    private static final Pattern PERIOD_IRRELEVANT = Pattern.compile(
            "연체기간에\\s*관계없이", Pattern.CASE_INSENSITIVE
    );

    // -------- 공개: 한 번에 파싱 --------
    public static Map<String,Object> parseAll(String raw){
        String s = normalize(raw);
        Map<String,Object> out = new LinkedHashMap<>();

        // 1) 기준+가산 (여러 개면 대표 가산=최댓값, 기준 라벨도 함께)
        double bestAdd = 0d;
        String baseLabel = null;

        Matcher m1 = BASE_PLUS.matcher(s);
        while (m1.find()){
            double add = toD(m1.group("pct"));
            if (add > bestAdd){ bestAdd = add; baseLabel = m1.group("base"); }
            appendList(out, "additives", Map.of("base", m1.group("base"), "addPct", add));
        }
        // ALT 패턴도 스캔
        Matcher m1a = BASE_PLUS_ALT.matcher(s);
        while (m1a.find()){
            double add = toD(m1a.group("pct"));
            if (add > bestAdd){ bestAdd = add; baseLabel = m1a.group("base"); }
            appendList(out, "additives", Map.of("base", m1a.group("base"), "addPct", add));
        }
        if (bestAdd > 0) {
            out.put("baseLabel", baseLabel == null ? "대출금리" : baseLabel);
            out.put("addPct", bestAdd); // 대표 가산%
        }

        // 2) 상한(cap) 수집 (여러 개면 최솟값을 대표 상한으로)
        double capMin = Double.POSITIVE_INFINITY;
        Matcher mc = CAP_MAX.matcher(s);
        while (mc.find()){
            double cap = toD(mc.group("cap"));
            appendList(out, "caps", cap);
            if (cap < capMin) capMin = cap;
        }
        if (capMin < Double.POSITIVE_INFINITY) out.put("capMaxPct", capMin);

        // 3) 특약: 기준>=N% 이면 +M% 가산 (복수 허용)
        Matcher ma = CONDITIONAL_ADD.matcher(s);
        while (ma.find()){
            Map<String,Object> cond = new LinkedHashMap<>();
            cond.put("baseThresholdPct", toD(ma.group("thresh")));
            cond.put("extraAddPct",     toD(ma.group("add")));
            appendList(out, "conditionalAdds", cond);
        }

        // 4) 구간 규칙
        Matcher mp = PERIOD_RULE.matcher(s);
        while (mp.find()){
            Map<String,Object> rule = new LinkedHashMap<>();
            rule.put("period", mp.group("period")); // 예: "1개월이내", "3개월초과"
            rule.put("base",   mp.group("base"));
            rule.put("addPct", toD(mp.group("pct")));
            appendList(out, "periodRules", rule);
        }

        // 5) 연체기간 무관 플래그
        if (PERIOD_IRRELEVANT.matcher(s).find()){
            out.put("periodIrrelevant", true);
        }

        return out;
    }

    // -------- 내부 유틸 --------
    private static String normalize(String raw){
        if (raw == null) return "";
        String s = raw;
        // 전각/기호 통일
        s = s.replace('％','%')
                .replace('＋','+')
                .replace('：',':')
                .replace('○',' ')
                .replace('·',' ')
                .replace('–','-')
                .replace('—','-');
        // 공백 축약
        s = s.replaceAll("\\s+"," ").trim();
        // 동의어
        s = s.replace("최고적용", "최고")
                .replace("최고 연체이자율", "최고")
                .replace("최대 연", "최대 ")
                .replace("연체대출최고금리", "최고")
                .replace("연체금리 최고율", "최고");
        return s;
    }
    private static double toD(String s){
        if (s == null) return 0d;
        String t = s.replaceAll("[^0-9.]", "");
        return t.isEmpty()?0d:Double.parseDouble(t);
    }
    @SuppressWarnings("unchecked")
    private static void appendList(Map<String,Object> out, String key, Object v){
        ((List<Object>) out.computeIfAbsent(key,k->new ArrayList<>())).add(v);
    }

    // 데모
    public static void main(String[] args){
        String sample = """
            적용금리 + 3% (최고 15%)
            -1개월이내: 대출금리+3%
            -3개월이내: 대출금리+3%
            -3개월초과: 대출금리+3%(최고 연체이자율 :15%)
            대출금리 + 연 3% (최고 연체이자율 : 연 15%)
            적용금리+3%(최고 15%) 단, 대출이자가 연 15% 이상인 경우 연체이자 연 2%를 가산
            연체기간에 관계없이 대출금리 + 3% 최대 연 15%
        """;
        Map<String,Object> m = parseAll(sample);
        m.forEach((k,v)-> System.out.println(k+" = "+v));
    }
}
