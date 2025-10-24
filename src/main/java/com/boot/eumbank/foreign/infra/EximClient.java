// com.boot.eumbank.foreign.infra.EximClient.java
package com.boot.eumbank.foreign.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class EximClient {

    private final RestTemplate rt = new RestTemplate(); // ← 오타/개행 수정

    @Value("${exim.api.base}")
    private String baseUrl;

    @Value("${exim.api.key}")
    private String authKey;

    public List<Row> fetchToday() {
        // 오늘(YYYYMMDD)
        String yyyymmdd = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE);

        String url = String.format(
                "%s?authkey=%s&data=AP01&searchdate=%s",
                baseUrl, authKey, yyyymmdd
        );

        // Object로 받고 instanceof 로 안전하게 캐스팅
        Object resp = rt.getForObject(url, Object.class);
        if (!(resp instanceof List<?> list)) {
            return List.of();
        }

        List<Row> out = new ArrayList<>();
        for (Object o : list) {
            if (o instanceof Map<?, ?> m) {
                Row r = new Row();
                r.curUnit   = Objects.toString(m.get("cur_unit"), null);
                r.curNm     = Objects.toString(m.get("cur_nm"), null);
                r.ttb       = toBd(m.get("ttb"));
                r.tts       = toBd(m.get("tts"));
                r.dealBasR  = toBd(m.get("deal_bas_r"));

                if (r.curUnit != null && r.dealBasR != null) out.add(r);
            }
        }
        return out;
    }

    private BigDecimal toBd(Object v) {
        if (v == null) return null;
        String s = Objects.toString(v, "").replace(",", "").trim();
        if (s.isEmpty()) return null;
        try {
            return new BigDecimal(s);
        } catch (Exception ignore) {
            return null;
        }
    }

    /** 필요한 필드만 담는 간단 DTO */
    public static class Row {
        public String curUnit;     // USD, JPY, …
        public String curNm;       // 미국달러, 일본엔 …
        public BigDecimal ttb;     // 사다
        public BigDecimal tts;     // 팔때
        public BigDecimal dealBasR;// 기준
    }
}
