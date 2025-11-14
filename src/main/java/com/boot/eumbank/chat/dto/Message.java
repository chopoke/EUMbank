package com.boot.eumbank.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    
    /**
     * 메시지 ID (선택적)
     * DB에 저장할 경우 사용
     */
    private Long id;
    
    /**
     * 메시지 발신자 역할
     * "user" : 사용자 메시지
     * "assistant" : AI 응답 (Gemini)
     * "system" : 시스템 메시지
     */
    private String role;
    
    /**
     * 메시지 내용
     */
    private String content;
    
    /**
     * 메시지 전송/생성 시간
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    /**
     * 세션 ID (선택적)
     * 대화 세션 추적용
     */
    private String sessionId;
    
    /**
     * 사용자 ID (선택적)
     * 로그인한 사용자의 경우
     */
    private Long userId;
    
    /**
     * 메시지 상태 (선택적)
     * "sent", "delivered", "read", "error"
     */
    private String status;
    
    /**
     * 편의 생성자 - role과 content만으로 생성
     */
    public Message(String role, String content) {
        this.role = role;
        this.content = content;
        this.timestamp = LocalDateTime.now();
        this.status = "sent";
    }
    
    /**
     * 편의 생성자 - role, content, timestamp
     */
    public Message(String role, String content, LocalDateTime timestamp) {
        this.role = role;
        this.content = content;
        this.timestamp = timestamp;
        this.status = "sent";
    }
    
    /**
     * 사용자 메시지 생성 헬퍼 메서드
     */
    public static Message userMessage(String content) {
        return Message.builder()
            .role("templates/user")
            .content(content)
            .timestamp(LocalDateTime.now())
            .status("sent")
            .build();
    }
    
    /**
     * AI 응답 메시지 생성 헬퍼 메서드
     */
    public static Message assistantMessage(String content) {
        return Message.builder()
            .role("assistant")
            .content(content)
            .timestamp(LocalDateTime.now())
            .status("sent")
            .build();
    }
    
    /**
     * 시스템 메시지 생성 헬퍼 메서드
     */
    public static Message systemMessage(String content) {
        return Message.builder()
            .role("system")
            .content(content)
            .timestamp(LocalDateTime.now())
            .status("sent")
            .build();
    }
}