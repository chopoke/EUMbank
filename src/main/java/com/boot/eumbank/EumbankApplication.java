package com.boot.eumbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync // FCM 알림을 비동기로 처리하기 위한 설정
public class EumbankApplication {
    public static void main(String[] args) {
        SpringApplication.run(EumbankApplication.class, args);
    }
}


