package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "UTILITY_BILL_TBL")
@Getter @Setter
public class UtilityBill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ub_no") private Integer ubNo;

    @Column(name = "c_no", nullable = false) private Integer cNo;                 // FK
    @Column(name = "bp_code", length = 20, nullable = false) private String bpCode; // FK
    @Column(name = "ub_id", length = 40, nullable = false) private String ubId;     // unique with bp_code
    @Column(name = "ub_holder", length = 100) private String ubHolder;
    @Column(name = "ub_addr", length = 200) private String ubAddr;
    @Column(name = "ub_meter_no", length = 50) private String ubMeterNo;
    @Column(name = "ub_status", length = 20, nullable = false) private String ubStatus = "ACTIVE";
    @Column(name = "ub_created_at") private LocalDateTime ubCreatedAt;
    @Column(name = "ub_updated_at") private LocalDateTime ubUpdatedAt;
}
