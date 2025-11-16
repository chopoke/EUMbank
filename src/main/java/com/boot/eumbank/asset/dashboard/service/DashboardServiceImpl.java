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
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.Comparator.naturalOrder;

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
        BigDecimal gold = dashboardRepository.sumGold(cNo);

        BigDecimal totalAssets = cash.add(foreign).add(installment).add(deposit).add(gold);
        BigDecimal totalLiabilities  = dashboardRepository.sumLoan(cNo);       // 대출 붙이면 교체
        BigDecimal netWorth    = totalAssets.subtract(totalLiabilities);


        BigDecimal dueInstallments  = dashboardRepository.sumInstallmentMonthlyDue(cNo);
        BigDecimal dueLoans = dashboardRepository.sumLoanMonthlyDue(cNo);
        BigDecimal dueBills = dashboardRepository.sumBillMonthlyDue(cNo);
        BigDecimal monthlyDue = dueInstallments.add(dueLoans).add(dueBills);

        List<AssetCompositionDto> composition = List.of(
                new AssetCompositionDto("입출금",    cash),
                new AssetCompositionDto("외환",       foreign),
                new AssetCompositionDto("적금", installment),
                new AssetCompositionDto("예금",     deposit),
                new AssetCompositionDto("현물", gold)
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
            logger.info("<<< 활성 고객이 없습니다. 스냅샷 생략 >>>");
            return;
        }

        List<AssetDailySnapshot> rows = new ArrayList<>(cNos.size());
        for (Integer cNo : cNos) {
            try {
                AssetSummaryDto s = getDashboardSummary(cNo);

                Map<String, BigDecimal> comp =  s.composition().stream()
                                                .collect(Collectors.toMap(
                                                   AssetCompositionDto::category,
                                                   AssetCompositionDto::amountKrw
                                                ));

                BigDecimal cash        = comp.getOrDefault("입출금", BigDecimal.ZERO);
                BigDecimal foreign     = comp.getOrDefault("외환",   BigDecimal.ZERO);
                BigDecimal installment = comp.getOrDefault("적금",   BigDecimal.ZERO);
                BigDecimal deposit     = comp.getOrDefault("예금",   BigDecimal.ZERO);
                BigDecimal gold        = comp.getOrDefault("현물",   BigDecimal.ZERO);

                rows.add(AssetDailySnapshot.builder()
                        .cNo(cNo)
                        .adsYmd(ymd)                         // DATE 컬럼
                        .adsTotalAssets(s.totalAssets())
                        .adsTotalLiabilities(s.totalLiabilities())
                        .adsNetWorth(s.netWorth())
                        .adsTotalCash(cash)
                        .adsTotalInstallment(installment)
                        .adsTotalDeposit(deposit)
                        .adsTotalForeign(foreign)
                        .adsTotalGold(gold)
                        .build());
            } catch (Exception ex) {
                // 한 명 실패해도 나머지는 계속 적재 (운영에서 중요)
                logger.warn("<<< 스냅샷 실패 cNo={}: {} >>>", cNo, ex.getMessage(), ex);
            }
        }

        // 3) 배치 저장 (중복키는 '하루 1건' 유니크 제약으로 걸러짐)
        assetDailySnapshotRepository.saveAll(rows);
        logger.info("<<< 스냅샷 적재 완료: {}건 >>>", rows.size());

    }

    /**
     * 최근 30일 순자산 추이
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
                .toList();

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
                .max(naturalOrder())
                .orElse(last);

        BigDecimal min = points.stream()
                .map(AssetTrendPoint::netWorth)
                .min(naturalOrder())
                .orElse(last);

        BigDecimal changePct = BigDecimal.ZERO;
        if(first != null && first.signum() != 0) {
            changePct = change30.divide(first, 6, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100));
        }

        return new AssetTrendDto(points, dayDelta, change30, max, min, changePct);
    }

    public AssetTrendDto getTrend(int cNo, TrendMetric metric) {
        logger.info("<<< DashboardService getTrend >>>");

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(30);

        List<AssetDailySnapshot> rows = dashboardRepository.getSnapshots(cNo, start, end);
        if (rows.isEmpty()) {
            return new AssetTrendDto(List.of(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        // 스냅샷에서 어떤 값을 뽑을지 선택
        Function<AssetDailySnapshot, BigDecimal> pick = switch (metric) {
            case NET_WORTH         -> AssetDailySnapshot::getAdsNetWorth;
            case TOTAL_ASSETS      -> AssetDailySnapshot::getAdsTotalAssets;
            case TOTAL_LIABILITIES -> AssetDailySnapshot::getAdsTotalLiabilities;
            case CASH              -> AssetDailySnapshot::getAdsTotalCash;
            case INSTALLMENT       -> AssetDailySnapshot::getAdsTotalInstallment;
            case DEPOSIT           -> AssetDailySnapshot::getAdsTotalDeposit;
            case FOREIGN           -> AssetDailySnapshot::getAdsTotalForeign;
            case GOLD              -> AssetDailySnapshot::getAdsTotalGold;
        };

        List<AssetTrendPoint> points = rows.stream()
                .sorted(Comparator.comparing(AssetDailySnapshot::getAdsYmd))
                .map(r -> new AssetTrendPoint(r.getAdsYmd(), pick.apply(r)))
                .toList();

        BigDecimal first = points.get(0).netWorth();
        BigDecimal last  = points.get(points.size()-1).netWorth();
        BigDecimal prev  = points.size() > 1 ? points.get(points.size()-2).netWorth() : last;

        BigDecimal dayDelta = last.subtract(prev);
        BigDecimal change30 = last.subtract(first);
        BigDecimal max = points.stream().map(AssetTrendPoint::netWorth).max(naturalOrder()).orElse(last);
        BigDecimal min = points.stream().map(AssetTrendPoint::netWorth).min(naturalOrder()).orElse(last);
        BigDecimal changePct = (first.signum()!=0)
                ? change30.divide(first, 6, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

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
        TopLoanDto loan =
                dashboardRepository.getTopLoan(cNo).orElse(null);

        return new TopSavingsDto(installment, deposit, loan);
    }

}
