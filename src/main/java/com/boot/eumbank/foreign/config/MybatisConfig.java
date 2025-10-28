package com.boot.eumbank.foreign.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.boot.eumbank.account.Open.mapper")
public class MybatisConfig {}
