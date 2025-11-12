package com.boot.eumbank.asset.peer.service;

import com.boot.eumbank.asset.dashboard.dto.AssetCompositionDto;
import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.service.DashboardService;
import com.boot.eumbank.asset.peer.dto.PeerBucketKey;
import com.boot.eumbank.asset.peer.dto.PeerCompareResponse;
import com.boot.eumbank.asset.peer.dto.PeerProfileDto;
import com.boot.eumbank.asset.peer.dto.PeerTotals;
import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import com.boot.eumbank.asset.peer.repository.AssetManagementDataRepository;
import com.boot.eumbank.asset.peer.repository.AssetPeerDataRepository;
import com.boot.eumbank.asset.peer.repository.PeerRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

        PeerTotals newTotals = new PeerTotals(
                newAsset.totalAssets(),
                newAsset.totalLiabilities(),
                newAsset.netWorth(),
                cash,
                installment,
                deposit,
                foreign,
                gold
        );

        // 기존 amd
        AssetManagementData oldAmd = amdRepository.findByCNo(cNo).orElse(null);
        PeerBucketKey oldKey = null;
        PeerTotals oldTotals = PeerTotals.zero();

        Bounds bounds = incomeBounds(dto.getIncomeCd());

        if (oldAmd != null) {
            oldKey = new PeerBucketKey(
                    oldAmd.getAmdGender(), oldAmd.getAmdAgeBand(),
                    oldAmd.getAmdIncomeCd(), oldAmd.getAmdJobCd(), oldAmd.getAmdRegion()
            );
            oldTotals = new PeerTotals(
                    oldAmd.getAmdTotalAssets(), oldAmd.getAmdTotalLiabilities(), oldAmd.getAmdNetWorth(),
                    oldAmd.getAmdTotalCash(), oldAmd.getAmdTotalInstallment(), oldAmd.getAmdTotalDeposit(),
                    oldAmd.getAmdTotalForeign(), oldAmd.getAmdTotalGold()
            );
        } else {
            AssetManagementData amd = AssetManagementData.builder()
                    .cNo(cNo)
                    .amdGender(dto.getGender())
                    .amdAgeBand(dto.getAgeBand())
                    .amdIncomeCd(dto.getIncomeCd())
                    .amdIncomeMin(bounds.min())
                    .amdIncomeMax(bounds.max())
                    .amdJobCd(dto.getJobCd())
                    .amdRegion(dto.getRegion())
                    .amdCreatedAt(LocalDateTime.now())
                    .amdUpdatedAt(LocalDateTime.now())
                    .amdTotalAssets(newAsset.totalAssets())
                    .amdTotalLiabilities(newAsset.totalLiabilities())
                    .amdNetWorth(newAsset.netWorth())
                    .amdTotalCash(cash)
                    .amdTotalInstallment(installment)
                    .amdTotalDeposit(deposit)
                    .amdTotalForeign(foreign)
                    .amdTotalGold(gold)
                    .build();
            amdRepository.save(amd);
        }

        PeerBucketKey newKey = new PeerBucketKey(dto.getGender(), dto.getAgeBand(), dto.getIncomeCd(), dto.getJobCd(), dto.getRegion());

        AssetManagementData amd = (oldAmd == null ? new AssetManagementData() : oldAmd);

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

        return null;
    }

    private record Bounds(int min, Integer max) {}
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
}
