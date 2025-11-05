package com.boot.eumbank.chat.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiRequest {
    private List<GeminiContent> contents;
    private GeminiGenerationConfig generationConfig;
}