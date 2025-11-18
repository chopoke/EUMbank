package com.boot.eumbank.asset.peer.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerCompareResponse {

    // 나(현재 고객)의 합계
    private BigDecimal myTotalAssets;
    private BigDecimal myTotalLiabilities;
    private BigDecimal myNetWorth;
    private BigDecimal myCash;
    private BigDecimal myInstallment;
    private BigDecimal myDeposit;
    private BigDecimal myForeign;
    private BigDecimal myGold;

    // 그룹 평균(= 그룹 합계 / n)
    private BigDecimal avgTotalAssets;
    private BigDecimal avgTotalLiabilities;
    private BigDecimal avgNetWorth;
    private BigDecimal avgCash;
    private BigDecimal avgInstallment;
    private BigDecimal avgDeposit;
    private BigDecimal avgForeign;
    private BigDecimal avgGold;

    // 표본 수
    private int nCustomers;

    // 상위퍼센트
    private int topPct;

    // 프로필 라벨(프론트 표시에 사용)
    private String genderLabel;
    private String ageBandLabel;
    private String incomeCdLabel;
    private String jobCdLabel;
    private String regionLabel;

    private List<AdviceItem> advice;

}
