package com.boot.eumbank.asset.peer.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdviceItem {
    private String code;      // "CASH_HIGH", "DEBT_HIGH" ...
    private String title;     // 카드 타이틀
    private String message;   // 상세 문구
    private String severity;  // "info" | "warn" | "good"
}
