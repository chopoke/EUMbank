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
import java.util.ArrayList;
import java.util.List;
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
                        .regionCd(amd.getAmdRegionCd())
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
        String r = dto.getRegionCd();

        Bounds bounds = incomeBounds(dto.getIncomeCd());

        // 기존 amd
        AssetManagementData oldAmd = amdRepository.findByCno(cNo).orElse(null);
        PeerBucketKey oldKey = null;
        PeerTotals oldTotals = PeerTotals.zero();

        if (oldAmd != null) {
            oldKey = new PeerBucketKey(
                    oldAmd.getAmdGender(), oldAmd.getAmdAgeBand(),
                    oldAmd.getAmdIncomeCd(), oldAmd.getAmdJobCd(), oldAmd.getAmdRegionCd()
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
                    .amdRegionCd(r)
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
        
        // 상위퍼센트 계산
        BucketCounts counts = peerRepository.fetchNetWorthCounts(g, a, i, j, r, netWorth);
        long counts_n  = counts.n();
        long counts_le = counts.le();

        int topPct;
        if (counts_n <= 0) {
            topPct = 0; // 표본 없음
        } else {
            // 동순위 포함(<=): 유저에게 불리하지 않게
            // 상위% = 100 - floor((n - le) * 100 / n)
            topPct = (int)(100 - Math.floor((counts_n - counts_le) * 100.0 / counts_n));
            if (topPct < 0) topPct = 0;
            if (topPct > 100) topPct = 100;
        }

        List<AdviceItem> advice = buildAdvice(newTotals, apd, n, topPct);

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
                .topPct(topPct)
                .genderLabel(labelGender(g))
                .ageBandLabel(labelAge(a))
                .incomeCdLabel(labelIncome(i))
                .jobCdLabel(labelJob(j))
                .regionLabel(labelRegion(r))
                .advice(advice)
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

    private String labelAge(int cd) {
        return switch (cd) {
          case   20 -> "20대";
          case   30 -> "30대";
          case   40 -> "40대";
          case   50 -> "50대이상";
          default -> "";
        };
    }

    private String labelIncome(String cd) {
        return switch (cd) {
            case "I1" -> "100만원 미만";
            case "I2" -> "100~300만원";
            case "I3" -> "300~500만원";
            case "I4" -> "500~800만원";
            case "I5" -> "800~1000만원";
            case "I6" -> "1000만원 이상";
            default -> "";
        };
    }

    private String labelJob(String cd) {
        return switch (cd) {
            case "J1" -> "학생/무직";
            case "J2" -> "사무/전문직";
            case "J3" -> "서비스/판매직";
            case "J4" -> "생산/노무/현장";
            case "J5" -> "프리랜서/자영업/기타";
            default -> "";
        };
    }

    private String labelRegion(String cd) {
        return switch (cd) {
            case "R1" -> "수도권(서울/경기/인천)";
            case "R2" -> "영남(부산/대구/경북/경남/울산)";
            case "R3" -> "호남(광주/전북/전남)";
            case "R4" -> "충청·세종(대전/충북/충남/세종)";
            case "R5" -> "강원·제주";
            default -> "";
        };
    }

    private static BigDecimal pct(BigDecimal part, BigDecimal total) {
        if (part == null || total == null || total.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;
        return part.multiply(BigDecimal.valueOf(100))
                .divide(total, 1, RoundingMode.HALF_UP); // 소수1
    }

    private static BigDecimal diffPct(BigDecimal myPct, BigDecimal avgPct) {
        return myPct.subtract(avgPct); // (+)면 내가 높음
    }

    private List<AdviceItem> buildAdvice(
            PeerTotals mine, AssetPeerData apd, int n, int topPct) {

        logger.info("<<< PeerService buildAdvice >>>");

        // 내 비중 (%)
        BigDecimal myTotalA = mine.totalAssets();
        BigDecimal myCashP  = pct(mine.cash(), myTotalA);
        BigDecimal myInstP  = pct(mine.installment(), myTotalA);
        BigDecimal myDepP   = pct(mine.deposit(), myTotalA);
        BigDecimal myFxP    = pct(mine.foreign(), myTotalA);
        BigDecimal myGoldP  = pct(mine.gold(), myTotalA);
        BigDecimal myDebtP  = pct(mine.totalLiabilities(), myTotalA);

        // 평균 비중 (%)
        BigDecimal avgTotalA = n > 0 ? apd.getApdTotalAssets().divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal avgCashP  = pct(apd.getApdTotalCash().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP),   avgTotalA);
        BigDecimal avgInstP  = pct(apd.getApdTotalInstallment().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP), avgTotalA);
        BigDecimal avgDepP   = pct(apd.getApdTotalDeposit().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP),     avgTotalA);
        BigDecimal avgFxP    = pct(apd.getApdTotalForeign().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP),     avgTotalA);
        BigDecimal avgGoldP  = pct(apd.getApdTotalGold().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP),        avgTotalA);
        BigDecimal avgDebtP  = pct(apd.getApdTotalLiabilities().divide(BigDecimal.valueOf(Math.max(1,n)),2,RoundingMode.HALF_UP), avgTotalA);

        List<AdviceItem> out = new ArrayList<>();

        // 0) 순자산 상위 배지용 축하/주의
        if (topPct >= 70) {
            out.add(AdviceItem.builder()
                    .code("TOP_GOOD").severity("good")
                    .title("순자산 상위권이에요")
                    .message("같은 조건 중 상위 " + topPct + "%입니다. 현재의 저축/투자 패턴을 유지해 보세요.")
                    .build());
        } else if (topPct <= 30) {
            out.add(AdviceItem.builder()
                    .code("TOP_LOW").severity("warn")
                    .title("순자산 개선 여지")
                    .message("동일 그룹 대비 순자산이 낮은 편입니다. 지출 점검과 자동저축 설정을 권장해요.")
                    .build());
        }

        // 1) 현금성 과다 (내 현금 비중이 평균보다 15%p 이상 높음)
        if (diffPct(myCashP, avgCashP).compareTo(BigDecimal.valueOf(15)) >= 0) {
            out.add(AdviceItem.builder()
                    .code("CASH_HIGH").severity("info")
                    .title("현금성 자산이 많은 편")
                    .message("입출금·예치성 비중이 평균보다 높습니다. 일부를 정기예금/적금으로 전환하면 이자 수익을 늘릴 수 있어요.")
                    .build());
        }

        // 2) 예금/적금 부족 (평균보다 10%p 이상 낮음)
        if (diffPct(myDepP.add(myInstP), avgDepP.add(avgInstP)).compareTo(BigDecimal.valueOf(-10)) <= 0) {
            out.add(AdviceItem.builder()
                    .code("SAVING_LOW").severity("info")
                    .title("예·적금 비중이 낮아요")
                    .message("월 목표 금액을 정해 자동이체를 설정하면 안정적으로 순자산을 늘릴 수 있어요.")
                    .build());
        }

        // 3) 부채 비중 경고
        if (myDebtP.compareTo(BigDecimal.valueOf(40)) >= 0 && diffPct(myDebtP, avgDebtP).compareTo(BigDecimal.valueOf(5)) >= 0) {
            out.add(AdviceItem.builder()
                    .code("DEBT_HIGH").severity("warn")
                    .title("부채 비율 관리 필요")
                    .message("부채 비중이 높습니다. 상환 계획을 점검하고, 금리 인하 요청 또는 대환을 검토해 보세요.")
                    .build());
        }

        // 4) 외환/현물 0%인 경우 (위험분산 힌트)
        if (myFxP.add(myGoldP).compareTo(BigDecimal.ZERO) == 0 && topPct < 80) {
            out.add(AdviceItem.builder()
                    .code("DIVERSIFY").severity("info")
                    .title("자산군 분산 고려")
                    .message("외환·현물 등 비상관 자산을 소액으로 편입하면 변동성 완화에 도움이 됩니다.")
                    .build());
        }

        // 5) 표본 수 적으면 톤 다운
        if (n < 20) {
            out.add(AdviceItem.builder()
                    .code("SAMPLE_SMALL").severity("info")
                    .title("표본 수가 적어요")
                    .message("동일 조건 표본이 " + n + "명으로 적어 참고용으로 보시는 걸 권장합니다.")
                    .build());
        }

        return out;
    }
}
