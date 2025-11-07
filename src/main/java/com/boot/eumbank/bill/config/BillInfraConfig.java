package com.boot.eumbank.bill.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

// 예: com.boot.eumbank.bill.config.BillInfraConfig
@Configuration
@EnableConfigurationProperties(NhGiroProperties.class)
public class BillInfraConfig {}
