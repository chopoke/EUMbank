package com.boot.eumbank.bill.infra;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class HttpConfig {

    @Bean("kepcoRestTemplate")
    public RestTemplate kepcoRestTemplate(RestTemplateBuilder builder) {
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);  // ms
        f.setReadTimeout(10000);    // ms
        return builder.requestFactory(() -> f).build();
    }
}