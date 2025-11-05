package com.boot.eumbank.bill.config;

import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
@RequiredArgsConstructor
public class RestClients {
    private final KepcoProps props;

    @Bean(name="kepcoRt")
    public RestTemplate kepcoRestTemplate() {
        var reqCfg = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(props.getConnectTimeoutMs()))
                .setResponseTimeout(Timeout.ofMilliseconds(props.getReadTimeoutMs()))
                .build();
        var httpClient = HttpClients.custom()
                .setDefaultRequestConfig(reqCfg)
                .evictExpiredConnections()
                .evictIdleConnections(TimeValue.ofSeconds(30))
                .build();
        var tpl = new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));
        tpl.getMessageConverters().forEach(mc ->
                org.slf4j.LoggerFactory.getLogger("conv").info("converter={}", mc.getClass().getName()));
        return tpl;
    }
}