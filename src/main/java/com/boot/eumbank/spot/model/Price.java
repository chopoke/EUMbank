package com.boot.eumbank.spot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PRICE_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Price {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "p_no")
    private Integer pNo;

    @Column(name = "p_metal_code", nullable = false, length = 10)
    private String pMetalCode; // AU(금), AG(은), PT(백금)

    @Column(name = "p_base_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal pBasePrice;

    @Column(name = "p_buy_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal pBuyPrice;

    @Column(name = "p_sell_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal pSellPrice;

    @Column(name = "p_fluctuation_rate", precision = 8, scale = 4, nullable = false)
    private BigDecimal pFluctuationRate;

    @CreationTimestamp
    @Column(name = "p_created_at", nullable = false, updatable = false)
    private LocalDateTime pCreatedAt;
}
