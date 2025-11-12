package com.boot.eumbank.asset.peer.repository;

import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;


import static com.boot.eumbank.asset.peer.entity.QAssetManagementData.assetManagementData;

@Repository
@RequiredArgsConstructor
public class PeerRepository {

    private JPAQueryFactory queryFactory;

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
     * 고객 프로필 일부 필드 업데이트
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
}
