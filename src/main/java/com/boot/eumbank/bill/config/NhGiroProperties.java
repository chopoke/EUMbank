package com.boot.eumbank.bill.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ext.nh")
public record NhGiroProperties(
        String baseUrl,
        String apiKey,
        String orgCode,
        String clientId,
        String clientSecret
) {}
