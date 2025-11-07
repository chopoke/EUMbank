package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.AssetCompositionDto;
import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import com.boot.eumbank.asset.dashboard.repository.AssetDailySnapshotRepository;
import com.boot.eumbank.asset.dashboard.repository.DashboardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService{

    private static final Logger logger = LoggerFactory.getLogger(DashboardServiceImpl.class);


    private final DashboardRepository dashboardRepository;
    private final AssetDailySnapshotRepository assetDailySnapshotRepository;

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
        BigDecimal installment = dashboardRepository.sumInstallment(cNo);
        BigDecimal deposit = dashboardRepository.sumDeposit(cNo);

        BigDecimal totalAssets = cash.add(foreign).add(installment).add(deposit);
        BigDecimal totalLiabilities  = BigDecimal.ZERO;       // 대출 붙이면 교체
        BigDecimal netWorth    = totalAssets.subtract(totalLiabilities);
        BigDecimal monthlyDue  = dashboardRepository.sumMonthlyDue(cNo);

        List<AssetCompositionDto> composition = List.of(
                new AssetCompositionDto("입출금",    cash),
                new AssetCompositionDto("외화",       foreign),
                new AssetCompositionDto("적금", installment),
                new AssetCompositionDto("예금",     deposit)
//                new AssetCompositionDto("현물", gold)
        );

        return new AssetSummaryDto(totalAssets, totalLiabilities, netWorth, monthlyDue, composition);
    }

    @Transactional
    @Override
    public void takeDailySnapshot(LocalDate ymd) {
        logger.info("<<< DashboardService takeDailySnapshot >>>");

        List<Integer> cNos = dashboardRepository.getCNo();

        if(cNos.isEmpty()){
            logger.info("활성 고객이 없습니다. 스냅샷 생략");
            return;
        }

        List<AssetDailySnapshot> rows = new ArrayList<>(cNos.size());
        for (Integer cNo : cNos) {
            try {
                AssetSummaryDto s = getDashboardSummary(cNo);
                rows.add(AssetDailySnapshot.builder()
                        .cNo(cNo)
                        .adsYmd(ymd)                         // DATE 컬럼
                        .adsTotalAssets(s.totalAssets())
                        .adsTotalLiabilities(s.totalLiabilities())
                        .adsNetWorth(s.netWorth())
                        .build());
            } catch (Exception ex) {
                // 한 명 실패해도 나머지는 계속 적재 (운영에서 중요)
                logger.warn("스냅샷 실패 cNo={}: {}", cNo, ex.getMessage(), ex);
            }
        }

        // 3) 배치 저장 (중복키는 '하루 1건' 유니크 제약으로 걸러짐)
        assetDailySnapshotRepository.saveAll(rows);
        logger.info("스냅샷 적재 완료: {}건", rows.size());

    }


}
