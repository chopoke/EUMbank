package com.boot.eumbank.loan.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class WebClientConfig {
    @Bean
    public RestClient finlifeRestClient(@Value("${finlife.base-url}") String baseUrl){

        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}
