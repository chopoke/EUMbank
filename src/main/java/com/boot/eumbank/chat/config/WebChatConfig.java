package com.boot.eumbank.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebChatConfig {

    @Bean
    public WebClient webClientGemini() {
        return WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/models")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}