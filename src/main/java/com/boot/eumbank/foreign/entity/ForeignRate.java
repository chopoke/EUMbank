package com.boot.eumbank.foreign.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import java.math.BigDecimal;

/**
 * FOREIGN_RATE_TBL (환율 정보) 엔티티
 */
@Entity
@Table(name = "FOREIGN_RATE_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForeignRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fr_no", columnDefinition = "INT COMMENT '환율정보 번호(PK)'")
    private Integer frNo;

    @Column(name = "fr_cur_unit", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '통화 단위 (예: USD)'")
    private String frCurUnit;

    @Column(name = "fr_cur_nm", nullable = false, length = 100, columnDefinition = "VARCHAR(100) COMMENT '통화명 (예: 미국 달러)'")
    private String frCurNm;

    @Column(name = "fr_ttb", nullable = false, precision = 18, scale = 6, columnDefinition = "DECIMAL(18,6) COMMENT '살 때 (TTB)'")
    private BigDecimal frTtb;

    @Column(name = "fr_tts", nullable = false, precision = 18, scale = 6, columnDefinition = "DECIMAL(18,6) COMMENT '팔 때 (TTS)'")
    private BigDecimal frTts;

    @Column(name = "fr_deal_bas", nullable = false, precision = 18, scale = 6, columnDefinition = "DECIMAL(18,6) COMMENT '매매 기준율'")
    private BigDecimal frDealBas; // rateOf에서 사용할 필드

    @Column(name = "fr_observed_date", nullable = false)
    private LocalDate frObservedDate;
}