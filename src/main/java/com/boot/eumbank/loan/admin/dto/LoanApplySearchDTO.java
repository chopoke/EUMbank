package com.boot.eumbank.loan.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class LoanApplySearchDTO {
    private String keyword;           // laId, 고객명/번호, 계좌번호 일부 등 통합검색
    private Long lpdNo;               // 상품번호 필터
    private Integer cNo;              // 고객번호 필터
    private String status;            // 상태 문자열
    private LocalDateTime from;       // 제출일시 시작
    private LocalDateTime to;         // 제출일시 끝
    private Integer page;             // 페이지 (0 base)
    private Integer size;             // 페이지 사이즈
    private String channel;           // 접수채널
    private String sort;              // 정렬키(recent, amountDesc 등)
}
