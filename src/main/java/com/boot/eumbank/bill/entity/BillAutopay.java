package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="BILL_AUTOPAY_TBL")
@Getter
@Setter
public class BillAutopay {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer baNo;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="ub_no")
    private UtilityBill bill;

    @Column(name="a_no", nullable=false)
    private Integer aNo;

    @Column(length=1, nullable=false)
    private String baActive; // Y/N

    private Integer baPayDay;             // 1..31

    @Column(length=8) private String baPayTime; // "HH:MM:SS"
    private LocalDateTime baStartedAt;    // 00:00:00로 저장

    private LocalDateTime baEndedAt;      // null=무기한

    @Column(length=120) private String baMemo;
    private LocalDateTime baCreatedAt;

    private LocalDateTime baUpdatedAt;
}
