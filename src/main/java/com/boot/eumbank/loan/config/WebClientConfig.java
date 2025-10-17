package com.boot.eumbank.loan.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Bean(name = "finlifeRestClient")
    public RestClient finlifeRestClient(@Value("${finlife.base-url}") String baseUrl) {

        var jdk = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL) // 혹시 중간 리다이렉트가 있어도 따라가게
                .build();

        var factory = new JdkClientHttpRequestFactory(jdk);
        factory.setReadTimeout(Duration.ofSeconds(10));

        return RestClient.builder()
                .requestFactory(factory)
                .baseUrl(baseUrl) // https://finlife.fss.or.kr/finlifeapi
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.USER_AGENT, "EumBank/1.0 (+http://localhost)")
                .messageConverters(converters -> {
                    converters.removeIf(c -> c instanceof StringHttpMessageConverter);
                    converters.add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
                    if (converters.stream().noneMatch(c -> c instanceof MappingJackson2HttpMessageConverter)) {
                        converters.add(new MappingJackson2HttpMessageConverter());
                    }
                })
                .build();
    }
}
