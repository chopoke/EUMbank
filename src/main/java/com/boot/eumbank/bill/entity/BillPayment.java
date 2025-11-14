package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "BILL_PAYMENT_TBL")
@Getter @Setter
public class BillPayment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bp_no") private Integer bpNo;

    @Column(name = "bi_no", nullable = false) private Integer biNo;
    @Column(name = "a_no", nullable = false) private Integer aNo;
    @Column(name = "bp_id", length = 40, nullable = false) private String bpId;
    @Column(name = "bp_amount", precision = 18, scale = 2, nullable = false) private BigDecimal bpAmount;
    @Column(name = "bp_status", length = 20, nullable = false) private String bpStatus = "COMPLETED";
    @Column(name = "bp_receipt_no", length = 40) private String bpReceiptNo;
    @Column(name = "bp_paid_at") private LocalDateTime bpPaidAt;
    @Column(name = "bp_created_at") private LocalDateTime bpCreatedAt;
}
