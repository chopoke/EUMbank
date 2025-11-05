package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.config.KepcoProps;
import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Profile({"dev", "public"})
@RequiredArgsConstructor
public class KepcoAdapter implements BillProviderAdapter {

    private final KepcoProps props;

    @Resource(name = "kepcoRt")
    private RestTemplate rt;


    @Override
    public String providerCode() {
        return "KEPCO";
    }

    // 전기요금표 조회
    public Map<String,Object> fetchRates(int year, int month, String metroCd, String svcKindCd) {
        String mm = String.format("%02d", month);
        String cntrCd = mapSvcToCntr(svcKindCd);

        String url = UriComponentsBuilder.fromHttpUrl(props.getEndpoint())
                .queryParam("apiKey", props.getServiceKey())
                .queryParam("year", year)
                .queryParam("month", mm)
                .queryParam("metroCd", metroCd)
                .queryParam("cntrCd", cntrCd)
                .encode().toUriString();

        HttpHeaders h = new HttpHeaders();
        h.setAccept(List.of(MediaType.ALL));          // 406 방지
        h.set(HttpHeaders.USER_AGENT, "EUMBank/1.0"); // 일부 서버 우회용
        try {
            ResponseEntity<String> res = rt.exchange(url, HttpMethod.GET, new HttpEntity<>(h), String.class);
            String body = res.getBody() == null ? "" : res.getBody().trim();

            // 비JSON 응답이면 그대로 전달
            if (!looksLikeJson(body)) {
                log.warn("[KEPCO] non-json status={} url={} head={}", res.getStatusCodeValue(), url, head(body));
                return Map.of("httpStatus", res.getStatusCodeValue(), "raw", head(body));
            }

            // JSON 파싱
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(body, new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>(){});

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.warn("[KEPCO] 4xx {} url={} body={}", e.getStatusCode().value(), url, e.getResponseBodyAsString());
            throw new IllegalStateException("KEPCO_ERROR:" + e.getStatusCode().value());
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.warn("[KEPCO] 5xx {} url={} body={}", e.getStatusCode().value(), url, e.getResponseBodyAsString());
            throw new IllegalStateException("KEPCO_ERROR:" + e.getStatusCode().value());
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("[KEPCO] JSON parse fail url={} head={}", url, e.getOriginalMessage());
            return Map.of("httpStatus", 200, "raw", "JSON_PARSE_FAIL");
        }
    }

    private String mapSvcToCntr(String s) {
        if (s == null || s.isBlank()) return "100";
        return switch (s.trim()) { case "1","01"->"100"; case "2","02"->"200"; default->"100"; };
    }
    private static boolean looksLikeJson(String s) { String t = s.stripLeading(); return t.startsWith("{") || t.startsWith("["); }
    private static String head(String s) { return s.length()>200 ? s.substring(0,200) : s; }

    @Override
    public PayResult pay(PayCommand cmd) {
        try {
            // 데모용 호출(요금표 조회로 통신 확인)
            String url = UriComponentsBuilder.fromHttpUrl(props.getEndpoint())
                    .queryParam("apiKey", props.getServiceKey())
                    .queryParam("year", "2024")
                    .queryParam("month", "07")
                    .queryParam("metroCd", "11")
                    .queryParam("cntrCd", "100")
                    .encode()
                    .toUriString();

            String res = rt.getForObject(url, String.class);
            log.info("[KEPCO] PAY probe response head={}", res != null && res.length() > 120 ? res.substring(0,120) : res);

            // txId: 멱등키 > 청구서번호 > UUID
            String txId =
                    (cmd.idempotencyKey() != null && !cmd.idempotencyKey().isBlank())
                            ? "KEPCO-" + cmd.idempotencyKey()
                            : (cmd.invoice() != null && cmd.invoice().getBiNo() != null)
                            ? "KEPCO-BI-" + cmd.invoice().getBiNo()
                            : "KEPCO-" + java.util.UUID.randomUUID();

            return new PayResult(true, txId, null, "OK");
        } catch (Exception e) {
            log.error("[KEPCO] pay() failed", e);
            return new PayResult(false, null, null, "KEPCO_ERROR: " + e.getMessage());
        }
    }
}
