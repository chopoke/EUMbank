package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="BILL_INTEGRATION_LOG_TBL")
@Getter
@Setter
public class BillIntegrationLog {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer bilId;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="bpv_code", referencedColumnName="bpv_code")
    private BillProvider provider;

    @Column(length=8, nullable=false)
    private String bilDirection; // REQ/RES

    @Column(length=255)
    private String bilEndpoint;

    private Integer bilHttpStatus;

    @Column(length=64)
    private String bilReqIdemKey;

    private LocalDateTime bilStartedAt;

    private Integer bilElapsedMs;

    @Column(length=4000)
    private String bilReqBody;

    @Column(length=4000)
    private String bilResBody;

    private LocalDateTime bilCreatedAt;
}
