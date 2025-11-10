package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "WATER_RATE_TBL")
@Getter @Setter
public class WaterRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wr_id") private Integer wrId;

    @Column(name = "wr_eff_from") private LocalDateTime wrEffFrom;
    @Column(name = "wr_base_charge", precision = 18, scale = 2) private BigDecimal wrBaseCharge;
    @Column(name = "wr_unit_price", precision = 18, scale = 2) private BigDecimal wrUnitPrice;
}
