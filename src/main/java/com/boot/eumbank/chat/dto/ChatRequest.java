package com.boot.eumbank.chat.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {
    
    /**
     * 현재 사용자 메시지
     */
    private String message;
    
    /**
     * 대화 이력 (선택적)
     * 이전 대화 내용을 포함하여 문맥을 유지
     */
    private List<Message> history;
    
    /**
     * 사용자 ID (선택적)
     * 로그인한 사용자의 경우 추적용
     */
    private Long userId;
    
    /**
     * 세션 ID (선택적)
     * 비로그인 사용자의 대화 세션 추적용
     */
    private String sessionId;
}