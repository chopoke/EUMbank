package com.boot.eumbank.bill.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "kepco")
@Getter
@Setter
public class KepcoProps {
    private String endpoint;
    private String serviceKey;
    private int connectTimeoutMs = 2000;
    private int readTimeoutMs = 3000;
}

