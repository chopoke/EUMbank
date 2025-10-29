package com.boot.eumbank.foreign.infra;

import java.util.Map;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

public class EximRedirectProbe {

    /** 리다이렉트가 어디로 튀는지 확인용 */
    public static Map<String, Object> eximProbe(String url) {
        CloseableHttpClient http = HttpClients.custom()
                .disableRedirectHandling() // 자동 리다이렉트 비활성화
                .build();

        RestTemplate rt = new RestTemplate(new HttpComponentsClientHttpRequestFactory(http));
        HttpHeaders h = new HttpHeaders();
        h.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (EUMbank)");
        h.set(HttpHeaders.ACCEPT, "application/json");  // JSON 명시
        HttpEntity<Void> req = new HttpEntity<>(h);

        ResponseEntity<String> res = rt.exchange(url, HttpMethod.GET, req, String.class);
        System.out.println("[EXIM] status=" + res.getStatusCode());
        System.out.println("[EXIM] location=" + res.getHeaders().getFirst(HttpHeaders.LOCATION));
        System.out.println("[EXIM] contentType=" + res.getHeaders().getContentType());
        System.out.println("[EXIM] body(sample)=" + (res.getBody()!=null
                ? res.getBody().substring(0, Math.min(200, res.getBody().length()))
                : "null"));

        return Map.of(
                "status", res.getStatusCode(),
                "location", res.getHeaders().getFirst(HttpHeaders.LOCATION),
                "contentType", String.valueOf(res.getHeaders().getContentType())
        );
    }
}
