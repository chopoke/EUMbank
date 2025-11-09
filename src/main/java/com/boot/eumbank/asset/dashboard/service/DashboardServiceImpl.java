package com.boot.eumbank.asset.dashboard.service;

import com.boot.eumbank.asset.dashboard.dto.*;
import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import com.boot.eumbank.asset.dashboard.repository.AssetDailySnapshotRepository;
import com.boot.eumbank.asset.dashboard.repository.DashboardRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

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
                new AssetCompositionDto("외환",       foreign),
                new AssetCompositionDto("적금", installment),
                new AssetCompositionDto("예금",     deposit)
//                new AssetCompositionDto("현물", gold)
        );

        return new AssetSummaryDto(totalAssets, totalLiabilities, netWorth, monthlyDue, composition);
    }

    /**
     * 하루에 한번 활성화되어있는 고객들 자산 스냅샷
     * @param ymd 오늘날짜
     */
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

    /**
     *
     * @param cNo 고객번호
     * @return AssetTrendDto
     */
    @Override
    public AssetTrendDto getNetWorthTrend(int cNo){
        logger.info("<<< DashboardService getNetWorthTrend >>>");

        LocalDate end  = LocalDate.now();
        LocalDate start = end.minusDays(30);

        List<AssetDailySnapshot> assetTrendDto = dashboardRepository.getSnapshots(cNo, start, end);

        if(assetTrendDto.isEmpty()){
            return new AssetTrendDto(List.of(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        List<AssetTrendPoint> points = assetTrendDto.stream()
                .sorted(Comparator.comparing(AssetDailySnapshot::getAdsYmd))
                .map(r -> new AssetTrendPoint(r.getAdsYmd(), r.getAdsNetWorth()))
                .collect(Collectors.toList());

        BigDecimal first = points.get(0).netWorth();
        BigDecimal last = points.get(points.size() - 1).netWorth();

        BigDecimal dayDelta = BigDecimal.ZERO;
        if (points.size() > 1){
            BigDecimal prev =  points.get(points.size() - 2).netWorth();
            dayDelta = last.subtract(prev);
        }

        BigDecimal change30 = last.subtract(first);

        BigDecimal max = points.stream()
                .map(AssetTrendPoint::netWorth)
                .max(Comparator.naturalOrder())
                .orElse(last);

        BigDecimal min = points.stream()
                .map(AssetTrendPoint::netWorth)
                .min(Comparator.naturalOrder())
                .orElse(last);

        BigDecimal changePct = BigDecimal.ZERO;
        if(first != null && first.signum() != 0) {
            changePct = change30.divide(first, 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100));
        }

        return new AssetTrendDto(points, dayDelta, change30, max, min, changePct);
    }

    /**
     * 잔액이 가장 많은 예,적금 조회 
     * @param cNo 고객번호
     * @return TopSavingsDto
     */
    @Override
    public TopSavingsDto getTopSavings(int cNo) {
        logger.info("<<< DashboardService getTopSavings >>>");

        TopInstallmentDto installment =
                dashboardRepository.getTopInstallment(cNo).orElse(null);
        TopDepositDto deposit =
                dashboardRepository.getTopDeposit(cNo).orElse(null);

        return new TopSavingsDto(installment, deposit);
    }

}
