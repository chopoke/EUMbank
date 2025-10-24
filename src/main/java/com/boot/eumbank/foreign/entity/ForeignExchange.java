package com.boot.eumbank.foreign.entity;

import com.boot.eumbank.account.open.model.Account;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * FOREIGN_EXCHANGE_TBL (외화 환전 거래) 엔티티
 * 현재는 KRW를 외화로 사거나(BUY) 외화를 KRW로 팔 때(SELL)만 가정합니다.
 *
 * NOTE: fp_no는 임시로 1로 고정하고, FK 제약 조건은 잠시 무시하고 진행합니다.
 */
@Entity
@Table(name = "FOREIGN_EXCHANGE_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForeignExchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fe_no", columnDefinition = "INT COMMENT '외화번호(PK)'")
    private Integer feNo;

    @Column(name = "fp_no", nullable = false, columnDefinition = "INT COMMENT '외화상품번호'")
    private Integer fpNo; // ForeignProduct. 현재는 임시값 1

    @Column(name = "c_no", nullable = false, columnDefinition = "INT COMMENT '고객번호'")
    private Integer cNo;

    @Column(name = "a_no", nullable = false, columnDefinition = "INT COMMENT '계좌번호'")
    private Integer aNo; // 원화 계좌번호 (환전 대금 입출금용)

    @Column(name = "fe_id", nullable = false, length = 20, unique = true, columnDefinition = "VARCHAR(20) COMMENT '환전거래ID'")
    private String feId;

    @Column(name = "fe_cur_code", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '통화코드'")
    private String feCurCode; // 거래 통화 (예: USD)

    @Column(name = "fe_amt_fc", nullable = false, precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) COMMENT '외화금액'")
    private BigDecimal feAmtFc; // 외화 금액

    @Column(name = "fe_amt_krw", nullable = false, precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) COMMENT '원화금액'")
    private BigDecimal feAmtKrw; // 원화 금액 (환산액)

    @Column(name = "fe_rate_applied", nullable = false, precision = 16, scale = 6, columnDefinition = "DECIMAL(16,6) COMMENT '적용환율'")
    private BigDecimal feRateApplied; // 최종 적용 환율

    @Column(name = "fe_fee", nullable = false, precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) DEFAULT 0 COMMENT '수수료'")
    private BigDecimal feFee; // 수수료 (원화 환산)

    @Column(name = "fe_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '상태'")
    private String feStatus; // 상태 (REQUESTED/COMPLETED/CANCELLED)

    @Column(name = "fe_ordered_at", nullable = false, columnDefinition = "TIMESTAMP COMMENT '주문일시'")
    private LocalDateTime feOrderedAt;

    @Column(name = "fe_side", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '매수/매도'")
    private String feSide; // 매수(BUY: KRW->외화) / 매도(SELL: 외화->KRW)

    @Column(name = "fe_settled_at", columnDefinition = "TIMESTAMP NULL COMMENT '정산일시'")
    private LocalDateTime feSettledAt;

    @Column(name = "fe_memo", length = 200, columnDefinition = "VARCHAR(200) NULL COMMENT '메모'")
    private String feMemo;
}
