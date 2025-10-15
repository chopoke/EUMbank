// src/main/java/com/boot/eumbank/foreign/infra/EximClient.java
package com.boot.eumbank.foreign.infra;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class EximClient {

    private final RestTemplate rt;

    public EximClient() {
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(5000);
        this.rt = new RestTemplate(f);
    }

    @Value("${exim.api.base}")
    private String baseUrl;

    @Value("${exim.api.key}")
    private String authKey;

    public List<Row> fetchToday() {
        String ymd = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String url = String.format("%s?authkey=%s&data=AP01&searchdate=%s", baseUrl, authKey, ymd);
        log.info("[EXIM] GET {}", url.replace(authKey, "****"));

        try {
            ResponseEntity<Object> res = rt.getForEntity(url, Object.class);
            Object body = res.getBody();
            if (!(body instanceof List<?> list)) return List.of();

            List<Row> out = new ArrayList<>();
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    Row r = new Row();
                    r.curUnit  = Objects.toString(m.get("cur_unit"), null);
                    r.curNm    = Objects.toString(m.get("cur_nm"), null);
                    r.ttb      = toBd(m.get("ttb"));
                    r.tts      = toBd(m.get("tts"));
                    r.dealBasR = toBd(m.get("deal_bas_r"));
                    if (r.curUnit != null && r.dealBasR != null) out.add(r);
                }
            }
            return out;
        } catch (HttpStatusCodeException e) {
            log.error("[EXIM] upstream {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        }
    }

    private BigDecimal toBd(Object v) {
        String s = Objects.toString(v, "").replace(",", "").trim();
        if (s.isEmpty()) return null;
        try { return new BigDecimal(s); } catch (Exception ignore) { return null; }
    }

    public static class Row {
        public String curUnit, curNm;
        public BigDecimal ttb, tts, dealBasR;
    }
}
