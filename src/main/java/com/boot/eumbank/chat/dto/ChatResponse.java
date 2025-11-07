package com.boot.eumbank.chat.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 JSON에서 제외
public class ChatResponse {
    
    /**
     * AI의 응답 메시지
     */
    private String reply;
    
    /**
     * 응답 생성 시간
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    /**
     * 응답 상태
     * "success", "error", "partial", "timeout"
     */
    private String status;
    
    /**
     * 에러 메시지 (선택적)
     */
    private String errorMessage;
    
    /**
     * 에러 코드 (선택적)
     */
    private String errorCode;
    
    /**
     * 세션 ID (선택적)
     */
    private String sessionId;
    
    /**
     * 추천 질문 목록 (선택적)
     * AI가 제안하는 다음 질문들
     */
    private List<String> suggestedQuestions;
    
    /**
     * 관련 상품 코드 목록 (선택적)
     * 응답에 언급된 상품들
     */
    private List<String> relatedProducts;
    
    /**
     * 기본 생성자 - reply만으로 성공 응답 생성
     */
    public ChatResponse(String reply) {
        this.reply = reply;
        this.timestamp = LocalDateTime.now();
        this.status = "success";
    }
    
    /**
     * 성공 응답 생성 헬퍼 메서드
     */
    public static ChatResponse success(String reply) {
        return ChatResponse.builder()
            .reply(reply)
            .timestamp(LocalDateTime.now())
            .status("success")
            .build();
    }
    
    /**
     * 성공 응답 + 세션 ID
     */
    public static ChatResponse success(String reply, String sessionId) {
        return ChatResponse.builder()
            .reply(reply)
            .timestamp(LocalDateTime.now())
            .status("success")
            .sessionId(sessionId)
            .build();
    }
    
    /**
     * 성공 응답 + 추천 질문
     */
    public static ChatResponse successWithSuggestions(String reply, List<String> suggestedQuestions) {
        return ChatResponse.builder()
            .reply(reply)
            .timestamp(LocalDateTime.now())
            .status("success")
            .suggestedQuestions(suggestedQuestions)
            .build();
    }
    
    /**
     * 에러 응답 생성 헬퍼 메서드
     */
    public static ChatResponse error(String errorMessage) {
        return ChatResponse.builder()
            .reply("")
            .timestamp(LocalDateTime.now())
            .status("error")
            .errorMessage(errorMessage)
            .build();
    }
    
    /**
     * 에러 응답 + 에러 코드
     */
    public static ChatResponse error(String errorCode, String errorMessage) {
        return ChatResponse.builder()
            .reply("")
            .timestamp(LocalDateTime.now())
            .status("error")
            .errorCode(errorCode)
            .errorMessage(errorMessage)
            .build();
    }
    
    /**
     * 타임아웃 응답
     */
    public static ChatResponse timeout() {
        return ChatResponse.builder()
            .reply("응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
            .timestamp(LocalDateTime.now())
            .status("timeout")
            .errorCode("TIMEOUT")
            .errorMessage("Request timeout")
            .build();
    }
    
    /**
     * 부분 응답 (스트리밍용)
     */
    public static ChatResponse partial(String partialReply) {
        return ChatResponse.builder()
            .reply(partialReply)
            .timestamp(LocalDateTime.now())
            .status("partial")
            .build();
    }
}