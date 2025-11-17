package com.boot.eumbank.loan.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Finlife (금감원 API) 호출 담당 Service
 * 각 메서드 역할 
 * -> API를 호출해서 JSON반환 (원본 raw)
 * getMortgageProductRaw : 주택담보대출 API호출
 * getJeonseProductRaw : 전세자금대출 API호출
 * getCreditProductRaw : 신용대출 API 호출 --> 제거
 * -
 * topFinGrpNo 은 금융사 코드라고 할 수 있음 지금처럼 020000?은 은행이고 050000은 보험 
 * -> 일단 은행것만 끌어올라궁
 */

@Slf4j
@Service
public class FssFinlifeService {

    private final RestClient client;
    private final String apiKey;

    private final ObjectMapper om = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .findAndRegisterModules();

    public FssFinlifeService(RestClient finlifeRestClient, @Value("${finlife.api-key}") String apiKey) {
        this.client = finlifeRestClient;
        this.apiKey = apiKey;
    }

    //  FSS RAW 호출 ----------------------
    public String getMortgageProductsRaw(String topFinGrpNo, int pageNo){
        // Uri 컴포넌트 빌더 : URI를 구성하는 컴포넌트의 조합을 쉽게 만드어주는 클래스
        // .fromPath("String") : 주어진 경로로 초기화된 URI 주소 빌더(생성)
        // .queryParam(String name, Optional <value>) 주어진 값이 쿼리 매개변수로 들어감
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/mortgageLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();       // .toUri()로 빌드

        // 로그 마스크용
        String masked = apiKey == null ? "null"
                : (apiKey.length()>6 ? apiKey.substring(0,3)+"****"+apiKey.substring(apiKey.length()-3):"***");
        log.info("@@@@@@@@@@@@@@@@@@@@ [FSS] GET {} (auth={}) @@@@@@@@@@@@@@@@@@@@", uri, masked);

        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        log.info(" @@@@@@@@@@@@@@@@@@@@ [FSS] STATUS={}, HEADERS={} @@@@@@@@@@@@@@@@@@@@", resp.getStatusCode(), resp.getHeaders());

        String body = resp.getBody();
        log.info("@@@@@@@@@@@@@@@@@@@@ [FSS] BODY {}", body == null ? "null @@@@@@@@@@@@@@@@@@@@" : body.substring(0, Math.min(200, body.length())));

        if (body == null || body.isBlank()) {
            throw new IllegalStateException("@@@@@@@@@@@@@@@@@@@@ FSS 주담대 API body 비어있음 (status= " + resp.getStatusCode() + ") @@@@@@@@@@@@@@@@@@@@");
        }
        return body;
    }

    // 전세대출 원본 호출
    public String getJeonseProductsRaw(String topFinGrpNo, int pageNo) {
        var uri = UriComponentsBuilder.fromPath("/finlifeapi/rentHouseLoanProductsSearch.json")
                .queryParam("auth", apiKey)
                .queryParam("topFinGrpNo", topFinGrpNo)
                .queryParam("pageNo", pageNo)
                .build(true).toUri();
        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
        String body = resp.getBody();
        if (body == null || body.isBlank()) 
            throw new IllegalStateException(" @@ FSS 전세자금 API body 비어있음 (status=" + resp.getStatusCode() + ") @@");
        return body;
    }

//    // 신용대출 원본 호출
//    public String getCreditProductsRaw(String topFinGrpNo, int pageNo) {
//        var uri = UriComponentsBuilder.fromPath("/finlifeapi/creditLoanProductsSearch.json")
//                .queryParam("auth", apiKey)
//                .queryParam("topFinGrpNo", topFinGrpNo)
//                .queryParam("pageNo", pageNo)
//                .build(true).toUri();
//        var resp = client.get().uri(uri).retrieve().toEntity(String.class);
//        String body = resp.getBody();
//        if (body == null || body.isBlank()) throw new IllegalStateException("FSS empty body (credit)");
//        return body;
//    }


}
