package com.boot.eumbank.product.entity.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "DEPOSIT_PRODUCT_TBL")
public class ProductDepositList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dp_no")
    private Integer dpNo;

    @Column(name = "dp_code", unique = true, nullable = false, length = 50)
    private String dpCode;

    @Column(name = "dp_name", nullable = false, length = 100)
    private String dpName;

    @Column(name = "dp_description", columnDefinition = "TEXT")
    private String dpDescription;

    @Column(name = "dp_type", length = 50)
    private String dpType;

    @Column(name = "dp_min_amount")
    private BigDecimal dpMinAmount;

    @Column(name = "dp_max_amount")
    private BigDecimal dpMaxAmount;

    @Column(name = "dp_min_months")
    private Integer dpMinMonths;

    @Column(name = "dp_max_months")
    private Integer dpMaxMonths;

    @Column(name = "dp_early_termination_rate", precision = 5, scale = 2)
    private BigDecimal dpEarlyTerminationRate;

    @Column(name = "dp_interest_payment_type", length = 20)
    private String dpInterestPaymentType;

    @CreationTimestamp
    @Column(name = "dp_created_at", updatable = false)
    private LocalDateTime dpCreatedAt;

    @UpdateTimestamp
    @Column(name = "dp_updated_at")
    private LocalDateTime dpUpdatedAt;

    @Column(name = "dp_is_active")
    private String dpIsActive;

    @Column(name = "dp_rate")
    private String dpRate;

    @Column(name = "dp_feature")
    private String dpFeature;

    @Column(name = "dp_button_text")
    private String dpButtonText;

    @Column(name = "dp_href")
    private String dpHref;
}