package com.boot.eumbank.account.Open.dto;

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
    private String email;
    private String phone;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Match {
        private boolean name;
        private boolean rrn6;
    }
}