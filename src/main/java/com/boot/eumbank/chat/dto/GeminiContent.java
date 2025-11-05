package com.boot.eumbank.chat.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiContent {
    private List<GeminiPart> parts;
    private String role; // "user" or "model"
}