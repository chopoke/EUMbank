package com.boot.eumbank.bill.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ELECTRIC_AVG_TBL")
@Getter @Setter
public class ElectricAvg {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ea_id") private Integer eaId;

    @Column(name = "ea_year") private Integer eaYear;
    @Column(name = "ea_month") private Integer eaMonth;
    @Column(name = "ea_area_cd", length = 10) private String eaAreaCd;
    @Column(name = "ea_avg_unit", precision = 18, scale = 4) private BigDecimal eaAvgUnit;
    @Column(name = "ea_created_at") private LocalDateTime eaCreatedAt;
}
