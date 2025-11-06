package com.boot.eumbank.management.assetanalysis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 자산 목표 엔티티
 * 고객이 설정한 목표 순자산과 달성 기간을 관리
 */
@Entity
@Table(name = "ASSET_GOAL_TBL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ag_no")
    private Long id;

    @Column(name = "c_no", nullable = false)
    private Integer customerNo;

    @Column(name = "ag_target_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "ag_target_date")
    private LocalDate targetDate;

    @Column(name = "ag_current_amount", precision = 18, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "ag_achieved_rate", precision = 5, scale = 2)
    private BigDecimal achievedRate;

    @Column(name = "ag_expected_achievement_date")
    private LocalDate expectedAchievementDate;

    @Column(name = "ag_is_active", length = 1)
    @Builder.Default
    private String isActive = "Y";

    @Column(name = "ag_created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ag_updated_at")
    private LocalDateTime updatedAt;

    /**
     * 달성률 계산
     */
    public void calculateAchievementRate() {
        if (targetAmount != null && currentAmount != null && targetAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.achievedRate = currentAmount
                    .divide(targetAmount, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }

    /**
     * 목표 활성화 여부
     */
    public boolean isActive() {
        return "Y".equals(this.isActive);
    }

    /**
     * 정보 업데이트
     */
    public void updateInfo(BigDecimal currentAmount, LocalDate expectedDate) {
        this.currentAmount = currentAmount;
        this.expectedAchievementDate = expectedDate;
        calculateAchievementRate();
        this.updatedAt = LocalDateTime.now();
    }
}


