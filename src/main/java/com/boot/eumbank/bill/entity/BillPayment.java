package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="BILL_PAYMENT_TBL")
@Getter
@Setter
public class BillPayment {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="bp_no")
    private Integer bpNo;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="bi_no")
    private BillInvoice invoice;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="ub_no")
    private UtilityBill bill;

    @Column(name="a_no", nullable=false)
    private Integer aNo;

    @Column(name="bp_amount", precision=15, scale=2, nullable=false)
    private BigDecimal bpAmount;

    @Column(name="bp_status", length=16, nullable=false)
    private String bpStatus; // SUCCESS,PENDING,FAILED

    @Column(name="bp_provider_tx_id", length=80)
    private String bpProviderTxId;

    @Column(name="bp_receipt_no", length=80)
    private String bpReceiptNo;

    @Column(name="bp_idempotency_key", length=64)
    private String bpIdempotencyKey;

    @Column(name="bp_paid_at")
    private LocalDateTime bpPaidAt;

    @Column(name="bp_created_at")
    private LocalDateTime bpCreatedAt;

    @Column(name="bp_updated_at")
    private LocalDateTime bpUpdatedAt;
}
