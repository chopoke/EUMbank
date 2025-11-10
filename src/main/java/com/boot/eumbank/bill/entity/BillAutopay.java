package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "BILL_AUTOPAY_TBL")
@Getter @Setter
public class BillAutopay {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ba_no") private Integer baNo;

    @Column(name = "ub_no", nullable = false) private Integer ubNo;
    @Column(name = "a_no", nullable = false) private Integer aNo;
    @Column(name = "ba_active", length = 1, nullable = false) private String baActive = "Y"; // Y/N
    @Column(name = "ba_pay_day") private Integer baPayDay;
    @Column(name = "ba_pay_time", length = 8) private String baPayTime;
    @Column(name = "ba_started_at") private LocalDateTime baStartedAt;
    @Column(name = "ba_ended_at") private LocalDateTime baEndedAt;
    @Column(name = "ba_memo", length = 120) private String baMemo;
    @Column(name = "ba_created_at") private LocalDateTime baCreatedAt;
    @Column(name = "ba_updated_at") private LocalDateTime baUpdatedAt;
}
