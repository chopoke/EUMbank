package com.boot.eumbank.account.open.entity.account;

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
@Table(name = "INSTALLMENT_PRODUCT_TBL")
public class InstallmentProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ip_no")
    private Integer ipNo;

    @Column(name = "ip_code", unique = true, nullable = false, length = 50)
    private String ipCode;

    @Column(name = "ip_name", nullable = false, length = 100)
    private String ipName;

    @Column(name = "ip_description", columnDefinition = "TEXT")
    private String ipDescription;

    @Column(name = "ip_type", length = 50)
    private String ipType;

    @Column(name = "ip_min_months")
    private Integer ipMinMonths;

    @Column(name = "ip_max_months")
    private Integer ipMaxMonths;

    @Column(name = "ip_min_monthly_amount")
    private BigDecimal ipMinMonthlyAmount;

    @Column(name = "ip_max_monthly_amount")
    private BigDecimal ipMaxMonthlyAmount;

    @Column(name = "ip_early_termination_rate", precision = 5, scale = 2)
    private BigDecimal ipEarlyTerminationRate;

    @Column(name = "ip_interest_payment_type", length = 20)
    private String ipInterestPaymentType;

    @CreationTimestamp
    @Column(name = "ip_created_at", updatable = false)
    private LocalDateTime ipCreatedAt;

    @UpdateTimestamp
    @Column(name = "ip_updated_at")
    private LocalDateTime ipUpdatedAt;

    @Column(name = "ip_is_active")
    private String ipIsActive;
}
