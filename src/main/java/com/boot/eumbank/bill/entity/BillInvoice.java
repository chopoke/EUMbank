package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "BILL_INVOICE_TBL")
@Getter @Setter
public class BillInvoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bi_no") private Integer biNo;

    @Column(name = "ub_no", nullable = false) private Integer ubNo; // FK
    @Column(name = "a_no") private Integer aNo;                      // 옵션 FK
    @Column(name = "bi_id", length = 40, nullable = false) private String biId;
    @Column(name = "bi_year") private Integer biYear;
    @Column(name = "bi_month") private Integer biMonth;
    @Column(name = "bi_usage", precision = 18, scale = 2) private BigDecimal biUsage;
    @Column(name = "bi_amount", precision = 18, scale = 2) private BigDecimal biAmount;
    @Column(name = "bi_due_at") private LocalDateTime biDueAt;
    @Column(name = "bi_status", length = 20, nullable = false) private String biStatus = "READY";
    @Column(name = "bi_created_at") private LocalDateTime biCreatedAt;
}