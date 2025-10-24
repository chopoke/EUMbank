// src/main/java/com/boot/eumbank/foreign/infra/EximClient.java
package com.boot.eumbank.foreign.infra;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class EximClient {

    /** HttpClientConfig에서 만든 전용 RestTemplate 주입 */
    private final @Qualifier("eximRestTemplate") RestTemplate rt;

    @Value("${exim.api.base}")
    private String baseUrl;

    @Value("${exim.api.key}")
    private String authKey;

    /** 가장 최근(영업일 기준) 환율을 가져온다: 전날부터 거꾸로 탐색 */
    public List<Row> fetchLatest() {
        ZoneId KST = ZoneId.of("Asia/Seoul");
        LocalDate d = LocalDate.now(KST).minusDays(1);

        // 최대 7일 탐색
        for (int i = 0; i < 7; i++) {
            if (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) {
                d = d.minusDays(1);
                continue;
            }

            List<Row> out = fetchBy(d);  // ← 신규 메서드 재사용
            if (!out.isEmpty()) return out;

            d = d.minusDays(1);
        }

        log.warn("[EXIM] No data found in recent 7 days.");
        return List.of();
    }

    /** 추가: 특정 '관측일' 하루치 공시를 그대로 가져오기 */
    public List<Row> fetchBy(LocalDate date) {
        String ymd = date.format(DateTimeFormatter.BASIC_ISO_DATE);
        String url = String.format("%s?authkey=%s&data=AP01&searchdate=%s", baseUrl, authKey, ymd);
        log.info("[EXIM] GET {}", url.replace(authKey, "****"));

        try {
            HttpHeaders h = new HttpHeaders();
            h.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (EUMbank)");
            h.set(HttpHeaders.ACCEPT, "application/json");
            HttpEntity<Void> req = new HttpEntity<>(h);

            ResponseEntity<Object> res = rt.exchange(url, HttpMethod.GET, req, Object.class);
            String loc = res.getHeaders().getFirst(HttpHeaders.LOCATION);
            if (res.getStatusCode().is3xxRedirection() && loc != null) {
                URI next = resolveAgainst(url, loc);
                log.warn("[EXIM] 3xx -> Location: {}", loc);
                res = rt.exchange(next.toString(), HttpMethod.GET, req, Object.class);
            }

            Object body = res.getBody();
            if (body == null) {
                log.warn("[EXIM] Body is null (date={})", ymd);
                return List.of();
            }
            if (body instanceof List<?> list) {
                log.info("[EXIM] Raw Body Type: {} size={}", body.getClass().getName(), list.size());
                List<Row> out = parseRows(list, date); // 관측일 고정
                log.info("[EXIM] Parsed {} rows (date={})", out.size(), ymd);
                return out;
            } else {
                log.warn("[EXIM] Unexpected body: {}", body);
                return List.of();
            }
        } catch (HttpStatusCodeException e) {
            log.error("[EXIM] upstream {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.warn("[EXIM] request failed for date {}: {}", date, e.toString());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<Row> parseRows(List<?> list, LocalDate obsDate) {
        List<Row> out = new ArrayList<>();
        for (Object o : list) {
            if (o instanceof Map<?, ?> m) {
                Row r = new Row();
                r.curUnit  = Objects.toString(m.get("cur_unit"), null);
                r.curNm    = Objects.toString(m.get("cur_nm"), null);
                r.ttb      = toBd(m.get("ttb"));
                r.tts      = toBd(m.get("tts"));
                r.dealBasR = toBd(m.get("deal_bas_r"));
                r.date     = obsDate; // 관측일

                if (r.curUnit != null && r.dealBasR != null) {
                    out.add(r);
                } else {
                    log.debug("[EXIM] drop row (null field): {}", m);
                }
            }
        }
        return out;
    }

    private URI resolveAgainst(String originalUrl, String location) {
        return URI.create(originalUrl).resolve(location);
    }

    private BigDecimal toBd(Object v) {
        String s = Objects.toString(v, "").replace(",", "").trim();
        if (s.isEmpty()) return null;
        try { return new BigDecimal(s); } catch (Exception ignore) { return null; }
    }

    /** 파싱 결과 DTO */
    public static class Row {
        public String curUnit, curNm;
        public BigDecimal ttb, tts, dealBasR;
        public LocalDate date;
    }

    /** 수동 진단용 */
    public Map<String, Object> eximProbe(String url) {
        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (EUMbank)");
        h.set(HttpHeaders.ACCEPT, "application/json");
        HttpEntity<Void> req = new HttpEntity<>(h);

        ResponseEntity<String> res1 = rt.exchange(url, HttpMethod.GET, req, String.class);
        String loc = res1.getHeaders().getFirst(HttpHeaders.LOCATION);
        log.info("[EXIM#1] {} ct={}", res1.getStatusCode(), res1.getHeaders().getContentType());
        if (loc != null) log.info("[EXIM#1] Location={}", loc);

        if (res1.getStatusCode().is3xxRedirection() && loc != null) {
            ResponseEntity<String> res2 = rt.exchange(loc, HttpMethod.GET, req, String.class);
            log.info("[EXIM#2] {} ct={}", res2.getStatusCode(), res2.getHeaders().getContentType());
            log.info("[EXIM#2] sample={}", sample(res2.getBody()));
        } else {
            log.info("[EXIM#1] sample={}", sample(res1.getBody()));
        }
        return Map.of("ok", true);
    }

    private String sample(String s) {
        return (s == null) ? "null" : s.substring(0, Math.min(200, s.length()));
    }
}
