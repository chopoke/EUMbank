package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="BILL_INVOICE_TBL")
@Getter
@Setter
public class BillInvoice {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer biNo;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="ub_no")
    private UtilityBill bill;

    @Column(length=64)
    private String biProviderBillId;

    @Column(length=7, nullable=false)
    private String biBillYm; // YYYY-MM

    @Column(precision=15, scale=2, nullable=false)
    private BigDecimal biAmount;

    private LocalDateTime biDueAt;        // 00:00:00

    @Column(length=16, nullable=false)
    private String biStatus; // READY,PAID,CANCELLED,FAILED

    private LocalDateTime biCreatedAt;

    private LocalDateTime biUpdatedAt;
}