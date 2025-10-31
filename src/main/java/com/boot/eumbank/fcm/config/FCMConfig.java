package com.boot.eumbank.fcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Cloud Messaging (FCM) 설정 클래스
 * * <p>Firebase Admin SDK를 초기화하여 서버에서 클라이언트로 푸시 알림을 전송할 수 있도록 설정합니다.</p>
 * * @author EUMbank Team
 * @since 2025-10-28
 */
@Slf4j
@Configuration
public class FCMConfig {

    // application.yml에서 서비스 계정 파일 경로를 주입.
    @Value("${firebase.project-id}")
    private String projectId;

    @Value("${firebase.service-account.path}")
    private String serviceAccountPath;

    /**
     * Firebase Admin SDK 초기화
     * * <p>애플리케이션 시작 시 Firebase 서비스 계정 키를 로드하여 FCM을 초기화합니다.</p>
     * <p>서비스 계정 키 파일은 src/main/resources/ 경로에 위치해야 합니다.</p>
     * * @throws IOException Firebase 초기화 중 파일을 찾을 수 없거나 읽기 실패 시 발생
     */
    @PostConstruct
    public void initialize() {

        log.info("FCMConfig: @Value로 주입받은 projectId: '{}'", projectId);
        log.info("FCMConfig: @Value로 주입받은 serviceAccountPath: '{}'", serviceAccountPath);

        if (projectId == null || projectId.isBlank()) {
            log.error("application.yml에서 firebase.project-id받아오기 실패");
            throw new RuntimeException("firebase.project-id가 null이거나 비어있습니다.");
        }

        try {
            // Firebase가 이미 초기화되어 있는지 확인
            if (FirebaseApp.getApps().isEmpty()) {
                log.info("Firebase Admin SDK 초기화 시작.");

                // Value로 주입받은 경로 사용
                ClassPathResource resource = new ClassPathResource(serviceAccountPath);
                InputStream serviceAccount = resource.getInputStream();

                // Firebase 옵션 설정
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .setProjectId(projectId)
                        .build();

                // Firebase 앱 초기화
                FirebaseApp.initializeApp(options);

                log.info("✅ Firebase Admin SDK 초기화 완료 (Project ID: {})", projectId);
            } else {
                log.info("Firebase Admin SDK가 이미 초기화되어 있습니다.");
            }

        } catch (IOException e) {
            log.error("❌ Firebase Admin SDK 초기화 실패: {}", e.getMessage(), e);
            throw new RuntimeException("Firebase 초기화 실패. 서비스 계정 키 파일을 확인해주세요.", e);
        }
    }

    /**
     * FirebaseMessaging Bean 생성
     * 
     * @return FirebaseMessaging 인스턴스
     */
    @Bean
    public FirebaseMessaging firebaseMessaging() {
        return FirebaseMessaging.getInstance();
    }
}