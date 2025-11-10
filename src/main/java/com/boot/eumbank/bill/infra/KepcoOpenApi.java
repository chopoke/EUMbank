package com.boot.eumbank.bill.infra;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class KepcoOpenApi implements KepcoAdapter {
    private final @Qualifier("kepcoRestTemplate") RestTemplate rt; // @Bean 등록 필요
    // TODO: application.yml에 kepco.baseUrl, kepco.apiKey 등록
    @Override
    public BigDecimal fetchAvgUnitPrice(int year, int month, String areaCd) {
        // 임시 구현: 실제 API 파라미터에 맞춰 Map 파싱
        // String url = baseUrl + "?apiKey=...&year=...&month=...&metroCd=" + areaCd + "&...";
        // Map resp = rest.getForObject(url, Map.class);
        // BigDecimal unit = new BigDecimal(resp.get("avgUnit").toString());
        // return unit;
        return BigDecimal.valueOf(130.0); // 목업값. 나중에 실제 호출로 교체
    }
}
