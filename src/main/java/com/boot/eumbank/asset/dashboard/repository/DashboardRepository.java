package com.boot.eumbank.asset.dashboard.repository;

import com.boot.eumbank.asset.dashboard.dto.AssetCompositionDto;
import com.boot.eumbank.asset.dashboard.dto.AssetSummaryDto;
import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static com.boot.eumbank.customer.entity.QCustomer.customer;
import static com.boot.eumbank.account.open.entity.account.QAccount.account;
import static com.boot.eumbank.foreign.entity.QForeignRate.foreignRate;
import static com.boot.eumbank.product.entity.product.QProductInstallment.productInstallment;
import static com.boot.eumbank.product.entity.product.QProductDeposit.productDeposit;
import static com.boot.eumbank.asset.dashboard.entity.QAssetDailySnapshot.assetDailySnapshot;

@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardRepository {

    private final JPAQueryFactory queryFactory;

    /**
     * 입출금 총액
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumCash(int cNo) {
        return queryFactory.select(account.balance.sum().coalesce(BigDecimal.ZERO))
                .from(account)
                .where(
                        account.cNo.eq(cNo),
                        account.accountType.in("입출금", "자유적금"),
                        account.status.eq("ACTIVE"),
                        account.currency.eq("KRW")
                )
                .fetchOne();
    }

    /**
     * 외화 총액 (가장 최근 기준. fr_deal_bas(매매기준율)로 원화 환산)
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumForeign(int cNo) {
        // JPY(100) -> JPY
        StringExpression frUnit = Expressions.stringTemplate("function('substring_index', {0}, '(', 1)", foreignRate.frCurUnit);

        // '...(100)'이면 100, 아니면 1
        NumberExpression<BigDecimal> unitScale = Expressions.numberTemplate(BigDecimal.class, "CASE WHEN {0} LIKE '%(100)%' THEN 100.0 ELSE 1.0 END", foreignRate.frCurUnit);

        // 1단위 기준 환율
        NumberExpression<BigDecimal> rateParOne = foreignRate.frDealBas.divide(unitScale);

        // 서브쿼리: 별칭 분리 + 동일한 정규화 적용
        var frSub = new com.boot.eumbank.foreign.entity.QForeignRate("frSub");
        StringExpression frUnitSub =
                Expressions.stringTemplate(
                        "function('substring_index', {0}, '(', 1)", frSub.frCurUnit);

        var subMaxDate = JPAExpressions
                .select(frSub.frObservedDate.max())
                .from(frSub)
                .where(frUnitSub.eq(account.currency));

        return queryFactory.select(account.balance.multiply(rateParOne).sum().coalesce(BigDecimal.ZERO))
                .from(account)
                .leftJoin(foreignRate)
                .on(
                        frUnit.eq(account.currency),
                        foreignRate.frObservedDate.eq(subMaxDate)
                )
                .where(
                        account.cNo.eq(cNo),
                        account.accountType.eq("외환"),
                        account.status.eq("ACTIVE")
                )
                .fetchOne();
    }

    /**
     * 적금 총액(현재 원금잔액)
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumInstallment(int cNo) {
        NumberExpression<BigDecimal> iAmount = Expressions.numberTemplate(BigDecimal.class, "{0}", productInstallment.iAmount);
        return queryFactory.select(iAmount.sum().coalesce(BigDecimal.ZERO))
                .from(productInstallment)
                .where(
                        productInstallment.cNo.eq(cNo),
                        productInstallment.iStatus.in("ACTIVE", "COMPLETE")
                        //productInstallment.iStatus.eq("ACTIVE")
                )
                .fetchOne();
    }

    /**
     * 예금 총액(현재 원금잔액)
     */
    public BigDecimal sumDeposit(int cNo) {
        NumberExpression<BigDecimal> dAmount = Expressions.numberTemplate(BigDecimal.class, "{0}", productDeposit.dAmount);
        return queryFactory.select(dAmount.sum().coalesce(BigDecimal.ZERO))
                .from(productDeposit)
                .where(
                        productDeposit.cNo.eq(cNo),
                        productDeposit.dStatus.in("ACTIVE", "NONE")
                        //productDeposit.dStatus.eq("ACTIVE")
                )
                .fetchOne();
    }

    /**
     * 오늘 기준 이번달 납입 예정액(적금, 대출, 공과금)
     */
    public BigDecimal sumMonthlyDue(int cNo) {
        int today =LocalDate.now().getDayOfMonth();
        NumberExpression<Integer> payDay = Expressions.numberTemplate(Integer.class, "cast({0} as integer)", productInstallment.iPayDay);

        NumberExpression<BigDecimal> principalBal = Expressions.numberTemplate(BigDecimal.class, "{0}", productInstallment.iPrincipalBal);

        return queryFactory.select(principalBal.sum().coalesce(BigDecimal.ZERO))
                .from(productInstallment)
                .where(
                        productInstallment.cNo.eq(cNo),
                        productInstallment.iStatus.eq("ACTIVE"),
                        payDay.gt(today)
                ).fetchOne();
    }

    /**
     * 활성화되어 있는 회원 번호 리스트
     * @return List<Integer>
     */
    public List<Integer> getCNo() {
        return queryFactory.select(customer.customerNo)
                .from(customer)
                .where(
                        customer.cStatus.eq("ACTIVE")
                )
                .fetch();
    }

    /**
     * 최근 30일 추이 리스트
     * @param cNo 고객번호
     * @param from 시작날짜
     * @param to 마지막날짜
     * @return List<AssetDailySnapshot>
     */
    public List<AssetDailySnapshot> getSnapshots(int cNo, LocalDate from, LocalDate to) {
        return queryFactory.selectFrom(assetDailySnapshot)
                .where(
                        assetDailySnapshot.cNo.eq(cNo),
                        assetDailySnapshot.adsYmd.between(from, to)
                )
                .orderBy(assetDailySnapshot.adsYmd.asc())
                .fetch();
    }

    /**
     * 최근 2일 기록 리스트
     * @param cNo 고객번호
     * @return List<AssetDailySnapshot>
     */
    public List<AssetDailySnapshot> getLastTwo(int cNo) {
        return queryFactory.selectFrom(assetDailySnapshot)
                .where(assetDailySnapshot.cNo.eq(cNo))
                .orderBy(assetDailySnapshot.adsYmd.desc())
                .limit(2)
                .fetch();
    }
}
