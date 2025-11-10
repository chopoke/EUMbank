package com.boot.eumbank.spot.model;

/**
 * 이 클래스는 금/은 등 현물 상품 마스터를 나타내는 엔티티입니다.
 * 목적
 *  - 상품ID, 금속코드, 규격 등 거래에 필요한 메타 정보 제공
 * 사용
 *  - 거래 생성 시 참조됩니다.
 */

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "GOLD_PRODUCT_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gp_no")
    private Integer gpNo;
    
    @Column(name = "gp_id", unique = true, nullable = false, length = 20)
    private String gpId;
    
    @Column(name = "gp_metal_code", nullable = false, length = 10)
    private String gpMetalCode; // AU(금), AG(은), PT(백금)
    
    @Column(name = "gp_weight_g", precision = 10, scale = 3, nullable = false)
    private BigDecimal gpWeightG;
    
    @Column(name = "gp_purity", precision = 6, scale = 4)
    private BigDecimal gpPurity;
    
    @Column(name = "gp_name", nullable = false, length = 200)
    private String gpName;
    
    @Column(name = "gp_premium_per_g", precision = 18, scale = 2)
    private BigDecimal gpPremiumPerG;
    
    @Column(name = "gp_active_yn", length = 1, nullable = false)
    @Builder.Default
    private String gpActiveYn = "Y";
    
    @CreationTimestamp
    @Column(name = "gp_created_at", nullable = false, updatable = false)
    private LocalDateTime gpCreatedAt;
}
