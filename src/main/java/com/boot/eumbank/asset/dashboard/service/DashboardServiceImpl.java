package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.AssetCompositionDto;
import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.repository.DashboardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService{

    private static final Logger logger = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final DashboardRepository dashboardRepository;

    /**
     * 대시보드 요약
     * @param cNo 고객번호
     * @return AssetSummaryDto
     */
    @Override
    public AssetSummaryDto getDashboardSummary(int cNo) {
        logger.info("<<< DashboardService getDashboardSummary >>>");

        BigDecimal cash = dashboardRepository.sumCash(cNo);
        BigDecimal foreign = dashboardRepository.sumForeign(cNo);
        logger.info("foreign" +  foreign);
//        BigDecimal installment = dashboardRepository.sumInstallment(cNo);
//        BigDecimal deposit = dashboardRepository.sumDeposit(cNo);

        BigDecimal totalAssets = cash.add(foreign);
        BigDecimal totalLiabilities  = BigDecimal.ZERO;       // 대출 붙이면 교체
        BigDecimal netWorth    = totalAssets.subtract(totalLiabilities);
        //BigDecimal monthlyDue  = sumMonthlyDue(cNo);
        BigDecimal monthlyDue  = BigDecimal.ZERO;

        List<AssetCompositionDto> composition = List.of(
                new AssetCompositionDto("입출금",    cash),
                new AssetCompositionDto("외화",       foreign)
//                new AssetCompositionDto("적금", installment),
//                new AssetCompositionDto("예금",     deposit),
//                new AssetCompositionDto("현물", gold)
        );

        return new AssetSummaryDto(totalAssets, totalLiabilities, netWorth, monthlyDue, composition);
    }
}
