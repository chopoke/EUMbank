package com.boot.eumbank.asset.peer.service;

import com.boot.eumbank.asset.dashboard.dto.AssetCompositionDto;
import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.service.DashboardService;
import com.boot.eumbank.asset.peer.dto.*;
import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import com.boot.eumbank.asset.peer.entity.AssetPeerData;
import com.boot.eumbank.asset.peer.repository.AssetManagementDataRepository;
import com.boot.eumbank.asset.peer.repository.AssetPeerDataRepository;
import com.boot.eumbank.asset.peer.repository.PeerRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PeerServiceImpl implements PeerService{

    private static final Logger logger = LoggerFactory.getLogger(PeerService.class);

    private final AssetManagementDataRepository amdRepository;
    private final AssetPeerDataRepository apdRepository;
    private final PeerRepository peerRepository;
    private final DashboardService dashboardService;

    @Override
    public PeerProfileDto getMyProfile(int cNo) {
        logger.info("<<< PeerService getMyProfile >>>");
        return peerRepository.findAmdByCNo(cNo)
                .map(amd -> PeerProfileDto.builder()
                        .gender(amd.getAmdGender())
                        .ageBand(amd.getAmdAgeBand())
                        .incomeCd(amd.getAmdIncomeCd())
                        .jobCd(amd.getAmdJobCd())
                        .region(amd.getAmdRegion())
                        .build())
                .orElse(null);
    }

    @Transactional
    @Override
    public PeerCompareResponse saveProfileAndCompare(int cNo, PeerProfileDto dto) {
        logger.info("<<< PeerService saveProfileAndCompare >>>");

        // 1) 대시보드 합계 계산(현재 내 자산)
        AssetSummaryDto newAsset = dashboardService.getDashboardSummary(cNo);

        Map<String, BigDecimal> comp =  newAsset.composition().stream()
                .collect(Collectors.toMap(
                        AssetCompositionDto::category,
                        AssetCompositionDto::amountKrw
                ));

        BigDecimal cash        = comp.getOrDefault("입출금", BigDecimal.ZERO);
        BigDecimal foreign     = comp.getOrDefault("외환",   BigDecimal.ZERO);
        BigDecimal installment = comp.getOrDefault("적금",   BigDecimal.ZERO);
        BigDecimal deposit     = comp.getOrDefault("예금",   BigDecimal.ZERO);
        BigDecimal gold        = comp.getOrDefault("현물",   BigDecimal.ZERO);

        BigDecimal totalAssets     = newAsset.totalAssets();
        BigDecimal totalLiabilities= newAsset.totalLiabilities();
        BigDecimal netWorth        = newAsset.netWorth();

        PeerTotals newTotals = new PeerTotals(
                totalAssets,
                totalLiabilities,
                netWorth,
                cash,
                installment,
                deposit,
                foreign,
                gold
        );

        String g = dto.getGender();
        Integer a = dto.getAgeBand();
        String i = dto.getIncomeCd();
        String j = dto.getJobCd();
        String r = dto.getRegion();

        Bounds bounds = incomeBounds(dto.getIncomeCd());

        // 기존 amd
        AssetManagementData oldAmd = amdRepository.findByCno(cNo).orElse(null);
        PeerBucketKey oldKey = null;
        PeerTotals oldTotals = PeerTotals.zero();

        if (oldAmd != null) {
            oldKey = new PeerBucketKey(
                    oldAmd.getAmdGender(), oldAmd.getAmdAgeBand(),
                    oldAmd.getAmdIncomeCd(), oldAmd.getAmdJobCd(), oldAmd.getAmdRegion()
            );
            peerRepository.updateAmdProfile(cNo, g, a, i, bounds.min(), bounds.max(), j, r);

            oldTotals = new PeerTotals(
                    oldAmd.getAmdTotalAssets(), oldAmd.getAmdTotalLiabilities(), oldAmd.getAmdNetWorth(),
                    oldAmd.getAmdTotalCash(), oldAmd.getAmdTotalInstallment(), oldAmd.getAmdTotalDeposit(),
                    oldAmd.getAmdTotalForeign(), oldAmd.getAmdTotalGold()
            );
            peerRepository.updateAmdTotals(
                    cNo, totalAssets, totalLiabilities, netWorth,
                    cash, installment, deposit, foreign, gold
            );
        } else {
            AssetManagementData amd = AssetManagementData.builder()
                    .cno(cNo)
                    .amdGender(g)
                    .amdAgeBand(a)
                    .amdIncomeCd(i)
                    .amdIncomeMin(bounds.min())
                    .amdIncomeMax(bounds.max())
                    .amdJobCd(j)
                    .amdRegion(r)
                    .amdCreatedAt(LocalDateTime.now())
                    .amdUpdatedAt(LocalDateTime.now())
                    .amdTotalAssets(totalAssets)
                    .amdTotalLiabilities(totalLiabilities)
                    .amdNetWorth(netWorth)
                    .amdTotalCash(cash)
                    .amdTotalInstallment(installment)
                    .amdTotalDeposit(deposit)
                    .amdTotalForeign(foreign)
                    .amdTotalGold(gold)
                    .build();
            amdRepository.save(amd);
        }

        PeerBucketKey newKey = new PeerBucketKey(g, a, i, j, r);

        // 버킷 집계
        if (oldAmd == null) {
            // 신규: +1, +myTotals
            if (peerRepository.applyDeltaToPeerBucket(newKey, +1, newTotals) == 0) {
                // 해당 버킷이 없었다면 insert
                peerRepository.insertPeerBucketIfMissing(newKey, 1, newTotals);
            }
        } else if (oldKey.equals(newKey)) {
            // 버킷 동일: delta만 적용
            PeerTotals delta = newTotals.minus(oldTotals); // dn=0
            peerRepository.applyDeltaToPeerBucket(newKey, 0, delta);
        } else {
            // 버킷 변경: 옛 버킷에서 제거(-1, -oldTotals), 새 버킷에 추가(+1, +newTotals)
            peerRepository.applyDeltaToPeerBucket(oldKey, -1, oldTotals);
            if (peerRepository.applyDeltaToPeerBucket(newKey, +1, newTotals) == 0) {
                peerRepository.insertPeerBucketIfMissing(newKey, 1, newTotals);
            }
        }

        // 평균 계산 + 라벨링
        AssetPeerData apd = peerRepository.findPeerBucket(g, a, i, j, r).orElseThrow();
        int n = apd.getApdNCustomers();

        return PeerCompareResponse.builder()
                .myTotalAssets(totalAssets)
                .myTotalLiabilities(totalLiabilities)
                .myNetWorth(netWorth)
                .myCash(cash)
                .myInstallment(installment)
                .myDeposit(deposit)
                .myForeign(foreign)
                .myGold(gold)
                .avgTotalAssets(div(apd.getApdTotalAssets(), n))
                .avgTotalLiabilities(div(apd.getApdTotalLiabilities(), n))
                .avgNetWorth(div(apd.getApdNetWorth(), n))
                .avgCash(div(apd.getApdTotalCash(), n))
                .avgInstallment(div(apd.getApdTotalInstallment(), n))
                .avgDeposit(div(apd.getApdTotalDeposit(), n))
                .avgForeign(div(apd.getApdTotalForeign(), n))
                .avgGold(div(apd.getApdTotalGold(), n))
                .nCustomers(n)
                .genderLabel(labelGender(g))
                .ageBandLabel(a + "대")
                .incomeCdLabel(labelIncome(i))
                .jobCdLabel(labelJob(j))
                .regionLabel(r)
                .build();
    }

    private BigDecimal div(BigDecimal sum, int n) {
        if (sum == null || n <= 0) return BigDecimal.ZERO;
        return sum.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
    }

    private Bounds incomeBounds(String code) {
        return switch (code) {
            case "I1" -> new Bounds(0, 100);
            case "I2" -> new Bounds(100, 300);
            case "I3" -> new Bounds(300, 500);
            case "I4" -> new Bounds(500, 800);
            case "I5" -> new Bounds(800, 1000);
            case "I6" -> new Bounds(1000, null); // 오픈엔드
            default -> new Bounds(0, null);
        };
    }

    private String labelGender(String g) { return "F".equals(g) ? "여성" : "남성"; }

    private String labelIncome(String cd) {
        return switch (cd) {
            case "I1" -> "100만원 미만";
            case "I2" -> "100~300만원";
            case "I3" -> "300~500만원";
            case "I4" -> "500~800만원";
            case "I5" -> "800~1000만원";
            case "I6" -> "1000만원 이상";
            default -> cd;
        };
    }

    private String labelJob(String cd) {
        return switch (cd) {
            case "J1" -> "학생/무직";
            case "J2" -> "사무/전문직";
            case "J3" -> "서비스/판매직";
            case "J4" -> "생산/노무/현장";
            case "J5" -> "프리랜서/자영업/기타";
            default -> cd;
        };
    }
}
