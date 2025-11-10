package com.boot.eumbank.bill.infra;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Component
public class KepcoOpenApi implements KepcoAdapter {

    private final RestTemplate rt;

    public KepcoOpenApi(@Qualifier("kepcoRestTemplate") RestTemplate rt) {
        this.rt = rt;
    }

    @Override
    public BigDecimal fetchAvgUnitPrice(int year, int month, String areaCd) {
        // TODO: 실제 API 파라미터 구성 후 호출
        // String url = baseUrl + "?apiKey=...&year=...&month=...&metroCd=" + areaCd;
        // Map resp = rt.getForObject(url, Map.class);
        // BigDecimal unit = new BigDecimal(resp.get("avgUnit").toString());
        // return unit;
        return BigDecimal.valueOf(130.0); // 목업값
    }
}
