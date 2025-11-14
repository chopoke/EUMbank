package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "LOAN_DELINQUENCY_TBL")
@NoArgsConstructor @AllArgsConstructor @Builder @Data
public class LoanDelinquency {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ld_no")
    private Long ldNo;                      // PK

    @Column(name = "l_no", nullable = false)
    private Long loanNo;                    // loan_tbl의 pk FK연결

    @Column(name = "ld_id", nullable = false, length = 20, unique = true)
    private String ldId;                    // 연체ID

    @Column(name = "ld_schd_id")
    private Long scheduleId;                    // 스케줄ID (회차 연체면 값, 아니면 null)

    @Column(name = "ld_calc_date", nullable = false)
    private LocalDateTime calcDate;

    // ---- 금리/정책 스냅샷 ----
    @Column(name = "ld_pen_margin", precision = 5, scale = 3, nullable = false)
    private BigDecimal penMargin;                           // 가산마진 (%)

    @Column(name = "ld_del_rate", precision = 5, scale = 3, nullable = false)
    private BigDecimal delRate; // 적용 연체금리(%)

    @Column(name = "ld_cap_rate", precision = 5, scale = 3, nullable = false)
    private BigDecimal capRate; // 최대금리 캡(%)


    // ---- 금액 스냅샷 ----
    @Column(name = "ld_overdue_amt", precision = 18, scale = 2, nullable = false)
    private BigDecimal overdueAmt; // 당일 연체원금(미납잔액)

    @Column(name = "ld_del_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal delAmount; // 당일 발생 연체금액(일할)

    @Column(name = "ld_waived_yn", length = 1)
    private String waivedYn ; // 면제여부(N/Y)

    @Column(name = "ld_memo", length = 200)
    private String memo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
