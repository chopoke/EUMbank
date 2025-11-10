package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "GAS_RATE_TBL")
@Getter @Setter
class GasRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gr_id") private Integer grId;

    @Column(name = "gr_eff_from") private LocalDateTime grEffFrom;
    @Column(name = "gr_base_charge", precision = 18, scale = 2) private BigDecimal grBaseCharge;
    @Column(name = "gr_unit_price", precision = 18, scale = 2) private BigDecimal grUnitPrice;
}
