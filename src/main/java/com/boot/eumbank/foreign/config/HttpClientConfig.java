package com.boot.eumbank.foreign.config;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class HttpClientConfig {

    /** EXIM 전용 RestTemplate (자동 리다이렉트 금지) */
    @Bean(name = "eximRestTemplate")
    public RestTemplate eximRestTemplate() {
        CloseableHttpClient http = HttpClients.custom()
                .disableRedirectHandling() // ★ 자동 리다이렉트 끔
                .build();

        HttpComponentsClientHttpRequestFactory f = new HttpComponentsClientHttpRequestFactory(http);
        f.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        f.setReadTimeout((int) Duration.ofSeconds(10).toMillis());

        return new RestTemplate(f);
    }
}
