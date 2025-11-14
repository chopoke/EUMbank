// com.boot.eumbank.bill.infra.KepcoOpenApi
package com.boot.eumbank.bill.infra;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.http.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
public class KepcoOpenApi implements KepcoAdapter {

    private final KepcoProps props;
    private final ObjectMapper om;
    private final RestTemplate rt;

    public KepcoOpenApi(KepcoProps props) {
        this.props = props;
        this.om = new ObjectMapper();

        var f = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(10000);

        this.rt = new RestTemplate(f);
        this.rt.getMessageConverters()
                .add(new org.springframework.http.converter.StringHttpMessageConverter());
    }

    @Override
    public BigDecimal fetchAvgUnitPrice(int year, int month, String areaCd) {
        URI uri = UriComponentsBuilder.fromHttpUrl(props.getBaseUrl())
                .queryParam("apiKey", props.getApiKey())
                .queryParam("year", year)
                .queryParam("month", String.format("%02d", month))
                .queryParam("metroCd", areaCd)
                .queryParam("cntrCd", "100") // 주택용
                .queryParam("returnType", "json")
                .build(true)
                .toUri();

        ResponseEntity<String> res = rt.exchange(uri, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), String.class);
        String body = res.getBody();
        if (body == null || body.isBlank()) return BigDecimal.ZERO;

        try {
            JsonNode root = om.readTree(body);
            JsonNode arr = root.path("data");
            if (!arr.isArray() || arr.isEmpty()) arr = root.path("totData");
            if (!arr.isArray() || arr.isEmpty()) return BigDecimal.ZERO;

            for (JsonNode n : arr) {
                JsonNode v = n.has("unitCost") ? n.get("unitCost")
                        : n.has("avgUnitPrice") ? n.get("avgUnitPrice")
                        : n.has("unitPrice") ? n.get("unitPrice")
                        : null;
                if (v != null && v.isNumber()) return v.decimalValue();
            }
            return BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

}
