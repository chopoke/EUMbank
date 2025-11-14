package com.boot.eumbank.bill.config;

import com.boot.eumbank.bill.infra.KepcoProps;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({KepcoProps.class})
public class BillConfig {}