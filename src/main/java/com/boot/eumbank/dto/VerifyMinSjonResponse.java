package com.boot.eumbank.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class VerifyMinSjonResponse {
    private boolean ok;
    private String message;
    private Match matched;
    private double score; // 0.0~1.0ß

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Match {
        private boolean name;
        private boolean rrn6;
    }
}