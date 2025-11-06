package com.boot.eumbank.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiGenerationConfig {
    private Double temperature;
    private Integer maxOutputTokens;
    private Double topP;      // 선택적 추가
    private Integer topK;     // 선택적 추가
}