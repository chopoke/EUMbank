package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="UTILITY_BILL_TBL")
@Getter
@Setter
public class UtilityBill {
    @Id @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer ubNo;

    @Column(name="c_no")
    private Integer customerNo;                      // FK 그대로

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="bpv_code", referencedColumnName="bpv_code")
    private BillProvider provider;

    @Column(name="a_no")
    private Integer aNo; // 기본 납부 계좌

    @Column(length=64, nullable=false)
    private String ubId;

    @Column(length=50, nullable=false)
    private String ubType;

    @Column(length=64)
    private String ubCustomerNum;

    @Column(length=1, nullable=false)
    private String ubAutoPay; // Y/N

    @Column(length=1, nullable=false)
    private String ubActive;  // Y/N

    private LocalDateTime ubCreatedAt;

    private LocalDateTime ubUpdatedAt;
}
