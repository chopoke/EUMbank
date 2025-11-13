package com.boot.eumbank.asset.peer.repository;

import com.boot.eumbank.asset.peer.dto.PeerBucketKey;
import com.boot.eumbank.asset.peer.dto.PeerBucketSums;
import com.boot.eumbank.asset.peer.dto.PeerTotals;
import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import com.boot.eumbank.asset.peer.entity.AssetPeerData;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;


import static com.boot.eumbank.asset.peer.entity.QAssetManagementData.assetManagementData;
import static com.boot.eumbank.asset.peer.entity.QAssetPeerData.assetPeerData;

@Repository
@RequiredArgsConstructor
public class PeerRepository {

    private final JPAQueryFactory queryFactory;
    private final AssetPeerDataRepository apdRepository;

    /**
     * 고객 프로필 1행 조회
     * @param cNo 고객번호
     * @return AssetManagementData
     */
    public Optional<AssetManagementData> findAmdByCNo(int cNo) {
        return Optional.ofNullable(
                queryFactory.selectFrom(assetManagementData)
                        .where(assetManagementData.cno.eq(cNo))
                        .fetchOne()
        );
    }

    /**
     * 고객 프로필 조건 업데이트
     * @param cNo 고객번호
     * @param gender 성별
     * @param ageBand 연령대
     * @param incomeCd 월소득
     * @param incomeMin 하한
     * @param incomeMax 상한
     * @param jobCd 직업
     * @param region 지역
     * @return long
     */
    public long updateAmdProfile(
            int cNo, String gender, Integer ageBand, String incomeCd,
            Integer incomeMin, Integer incomeMax, String jobCd, String region
    ) {
        return queryFactory.update(assetManagementData)
                .set(assetManagementData.amdGender, gender)
                .set(assetManagementData.amdAgeBand, ageBand)
                .set(assetManagementData.amdIncomeCd, incomeCd)
                .set(assetManagementData.amdIncomeMin, incomeMin)
                .set(assetManagementData.amdIncomeMax, incomeMax)
                .set(assetManagementData.amdJobCd, jobCd)
                .set(assetManagementData.amdRegion, region)
                .where(assetManagementData.cno.eq(cNo))
                .execute();
    }

    /**
     * 고객 자산합계 업데이트 (대시보드 계산치 반영)
     * @param cNo 고객번호
     * @param totalAssets 총자산
     * @param totalLiabilities 총부채
     * @param netWorth 순자산
     * @param cash 총입출금
     * @param installment 총예금
     * @param deposit 총적금
     * @param foreign 총외환
     * @param gold 총골드
     * @return long
     */
    public long updateAmdTotals(
            int cNo,
            BigDecimal totalAssets, BigDecimal totalLiabilities, BigDecimal netWorth,
            BigDecimal cash, BigDecimal installment, BigDecimal deposit,
            BigDecimal foreign, BigDecimal gold
    ) {
        return queryFactory.update(assetManagementData)
                .set(assetManagementData.amdUpdatedAt, LocalDateTime.now())
                .set(assetManagementData.amdTotalAssets, totalAssets)
                .set(assetManagementData.amdTotalLiabilities, totalLiabilities)
                .set(assetManagementData.amdNetWorth, netWorth)
                .set(assetManagementData.amdTotalCash, cash)
                .set(assetManagementData.amdTotalInstallment, installment)
                .set(assetManagementData.amdTotalDeposit, deposit)
                .set(assetManagementData.amdTotalForeign, foreign)
                .set(assetManagementData.amdTotalGold, gold)
                .where(assetManagementData.cno.eq(cNo))
                .execute();
    }

    /**
     * 같은 조건의 또래 데이터 조회
     * @param gender 성별
     * @param ageBand 연령대
     * @param incomeCd 월소득
     * @param jobCd 직업
     * @param region 지역
     * @return AssetPeerData
     */
    public Optional<AssetPeerData> findPeerBucket(String gender, Integer ageBand, String incomeCd, String jobCd, String region) {
        return Optional.ofNullable(
                queryFactory.selectFrom(assetPeerData)
                        .where(
                                assetPeerData.apdGender.eq(gender),
                                assetPeerData.apdAgeBand.eq(ageBand),
                                assetPeerData.apdIncomeCd.eq(incomeCd),
                                assetPeerData.apdJobCd.eq(jobCd),
                                assetPeerData.apdRegion.eq(region)
                        )
                        .fetchOne()
        );
    }

    /**
     * 이전값과 차이나는 만큼 update
     * @param k PeerBucketKey
     * @param dn 고객수
     * @param d PeerTotals
     * @return long
     */
    public long applyDeltaToPeerBucket(PeerBucketKey k, int dn, PeerTotals d) {
        return queryFactory.update(assetPeerData)
                .set(assetPeerData.apdNCustomers, assetPeerData.apdNCustomers.add(dn))
                .set(assetPeerData.apdTotalAssets, assetPeerData.apdTotalAssets.add(d.totalAssets()))
                .set(assetPeerData.apdTotalLiabilities, assetPeerData.apdTotalLiabilities.add(d.totalLiabilities()))
                .set(assetPeerData.apdNetWorth, assetPeerData.apdNetWorth.add(d.netWorth()))
                .set(assetPeerData.apdTotalCash, assetPeerData.apdTotalCash.add(d.cash()))
                .set(assetPeerData.apdTotalInstallment, assetPeerData.apdTotalInstallment.add(d.installment()))
                .set(assetPeerData.apdTotalDeposit, assetPeerData.apdTotalDeposit.add(d.deposit()))
                .set(assetPeerData.apdTotalForeign, assetPeerData.apdTotalForeign.add(d.foreign()))
                .set(assetPeerData.apdTotalGold, assetPeerData.apdTotalGold.add(d.gold()))
                .where(
                        assetPeerData.apdGender.eq(k.gender()),
                        assetPeerData.apdAgeBand.eq(k.age()),
                        assetPeerData.apdIncomeCd.eq(k.income()),
                        assetPeerData.apdJobCd.eq(k.job()),
                        assetPeerData.apdRegion.eq(k.region())
                )
                .execute();
    }

    /**
     * 한번도 입력되지 않은 조건 추가
     * @param k PeerBucketKey
     * @param nInit 고객수
     * @param t PeerTotals
     */
    @Transactional
    public void insertPeerBucketIfMissing(PeerBucketKey k, int nInit, PeerTotals t) {
        try {
            apdRepository.save(AssetPeerData.builder()
                    .apdGender(k.gender()).apdAgeBand(k.age())
                    .apdIncomeCd(k.income()).apdJobCd(k.job()).apdRegion(k.region())
                    .apdNCustomers(nInit)
                    .apdTotalAssets(t.totalAssets())
                    .apdTotalLiabilities(t.totalLiabilities())
                    .apdNetWorth(t.netWorth())
                    .apdTotalCash(t.cash())
                    .apdTotalInstallment(t.installment())
                    .apdTotalDeposit(t.deposit())
                    .apdTotalForeign(t.foreign())
                    .apdTotalGold(t.gold())
                    .build());
        } catch (DataIntegrityViolationException e) {
            applyDeltaToPeerBucket(k, nInit, t);
        }
    }
}
