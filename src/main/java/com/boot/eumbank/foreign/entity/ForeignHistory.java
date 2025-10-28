package com.boot.eumbank.foreign.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * FOREIGN_HISTORY_TBL (외화 거래 내역) 엔티티
 */
@Entity
@Table(name = "FOREIGN_HISTORY_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForeignHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fh_no", columnDefinition = "INT COMMENT '외화이력번호(PK)'")
    private Integer fhNo;

    @Column(name = "c_no", nullable = false, columnDefinition = "INT COMMENT '고객번호'")
    private Integer cNo;

    @Column(name = "a_no", nullable = false, columnDefinition = "INT COMMENT '계좌번호ID(원화계좌)'")
    private Integer aNo;

    @Column(name = "fh_event_type", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '이벤트유형'")
    private String fhEventType; // 이벤트유형(WITHDRAWAL/DEPOSIT/EXCHANGE_BUY/EXCHANGE_SELL/FEE/REVERSAL)

    @Column(name = "fh_ex_id", length = 40, columnDefinition = "VARCHAR(40) NULL COMMENT '원거래ID'")
    private String fhExId; // FOREIGN_EXCHANGE_TBL.fe_id

    @Column(name = "fh_fx_cur_code", length = 10, columnDefinition = "VARCHAR(10) NULL COMMENT '통화코드'")
    private String fhFxCurCode;

    @Column(name = "fh_amt_krw", nullable = false, precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) DEFAULT 0 COMMENT '원화금액'")
    private BigDecimal fhAmtKrw;

    @Column(name = "fh_fx_amt_fc", precision = 18, scale = 2, columnDefinition = "DECIMAL(18,2) NULL COMMENT '외화금액'")
    private BigDecimal fhFxAmtFc;

    @Column(name = "fh_fx_rate_applied", precision = 16, scale = 6, columnDefinition = "DECIMAL(16,6) NULL COMMENT '적용환율'")
    private BigDecimal fhFxRateApplied;

    @Column(name = "fh_status", nullable = false, length = 20, columnDefinition = "VARCHAR(20) COMMENT '상태'")
    private String fhStatus; // 상태(REQUESTED/APPROVED/COMPLETED/CANCELLED/REJECTED)

    @Column(name = "fh_ordered_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '요청시각'")
    private LocalDateTime fhOrderedAt;

    @Column(name = "fh_completed_at", columnDefinition = "TIMESTAMP NULL COMMENT '완료시각'")
    private LocalDateTime fhCompletedAt;

    @Column(name = "fh_cancelled_at", columnDefinition = "TIMESTAMP NULL COMMENT '취소시각'")
    private LocalDateTime fhCancelledAt;

    @Column(name = "memo", length = 500, columnDefinition = "VARCHAR(500) NULL COMMENT '메모'")
    private String memo;
}
