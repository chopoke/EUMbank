package com.boot.eumbank.asset.dashboard.repository;

import com.boot.eumbank.asset.dashboard.dto.*;
import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.SubQueryExpression;
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
import java.util.Optional;

import static com.boot.eumbank.customer.entity.QCustomer.customer;
import static com.boot.eumbank.account.open.entity.account.QAccount.account;
import static com.boot.eumbank.foreign.entity.QForeignRate.foreignRate;
import static com.boot.eumbank.product.entity.product.QProductInstallment.productInstallment;
import static com.boot.eumbank.product.entity.
        product.QProductInstallmentList.productInstallmentList;
import static com.boot.eumbank.product.entity.product.QProductDeposit.productDeposit;
import static com.boot.eumbank.product.entity.product.QProductDepositList.productDepositList;
import static com.boot.eumbank.spot.model.QGoldWallet.goldWallet;
import static com.boot.eumbank.loan.entity.QLoan.loan;
import static com.boot.eumbank.loan.entity.QLoanSchedule.loanSchedule;
import static com.boot.eumbank.loan.entity.QLoanProduct.loanProduct;
import static com.boot.eumbank.bill.entity.QUtilityBill.utilityBill;
import static com.boot.eumbank.bill.entity.QBillInvoice.billInvoice;
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
     * 예금 총액(현재 잔액)
     * @param cNo 고객번호
     * @return BIgDecimal
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
     * 현물 총액(현물 통장 + 금 + 은)
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumGold(int cNo) {
        // 최신 시세 서브쿼리 (created_at 최신 또는 p_no 최대값 기준 — 둘 중 하나 택1)
        var auA = new com.boot.eumbank.spot.model.QPrice("auA");
        var auB = new com.boot.eumbank.spot.model.QPrice("auB");
        var agA = new com.boot.eumbank.spot.model.QPrice("agA");
        var agB = new com.boot.eumbank.spot.model.QPrice("agB");

        // 가장 최신의 p_base_price
        SubQueryExpression<BigDecimal> auPriceSub = JPAExpressions
                .select(auA.pBasePrice)
                .from(auA)
                .where(
                        auA.pMetalCode.eq("AU"),
                        auA.pCreatedAt.eq(
                                JPAExpressions.select(auB.pCreatedAt.max())
                                        .from(auB)
                                        .where(auB.pMetalCode.eq("AU"))
                        )
                );

        SubQueryExpression<BigDecimal> agPriceSub = JPAExpressions
                .select(agA.pBasePrice)
                .from(agA)
                .where(
                        agA.pMetalCode.eq("AG"),
                        agA.pCreatedAt.eq(
                                JPAExpressions.select(agB.pCreatedAt.max())
                                        .from(agB)
                                        .where(agB.pMetalCode.eq("AG"))
                        )
                );

        NumberExpression<BigDecimal> auPrice = Expressions.numberTemplate(
                BigDecimal.class, "({0})", auPriceSub);
        NumberExpression<BigDecimal> agPrice = Expressions.numberTemplate(
                BigDecimal.class, "({0})", agPriceSub);

        // 총합: 월렛현금 + 금그램수*금시세 + 은그램수*은시세
        NumberExpression<BigDecimal> totalExpr =
                goldWallet.gwCashBalance
                        .add(goldWallet.gwGoldBalance.multiply(auPrice))
                        .add(goldWallet.gwSilverBalance.multiply(agPrice));

        return queryFactory
                .select(totalExpr.sum().coalesce(BigDecimal.ZERO))
                .from(goldWallet)
                .where(
                        goldWallet.customer.customerNo.eq(cNo),
                        goldWallet.gwActiveYn.eq("Y")
                )
                .fetchOne();
    }

    /**
     * 총부채
     * @param cNo 고객번호
     * @return BIgDecimal
     */
    public BigDecimal sumLoan(int cNo) {
        return queryFactory
                .select(loan.balance.sum().coalesce(BigDecimal.ZERO))
                .from(loan)
                .where(
                        loan.cNo.eq(cNo),
                        loan.status.eq("ACTIVE")
                )
                .fetchOne();
    }

    /**
     * 오늘 기준 이번달 적금 납입 예정액
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumInstallmentMonthlyDue(int cNo) {
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
     * 오늘 기준 이번달 대출 납입 예정액
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumLoanMonthlyDue(int cNo) {
        int today = LocalDate.now().getDayOfMonth();

        return queryFactory
                .select(loanSchedule.dueTotal.sum().coalesce(BigDecimal.ZERO))
                .from(loanSchedule)
                .join(loan)
                .on(loanSchedule.loanNo.eq(loan.lNo))
                .where(
                        loan.cNo.eq(cNo),
                        loan.status.eq("ACTIVE"),
                        loanSchedule.status.eq("DUE"),
                        loan.payDay.gt(today)
                )
                .fetchOne();
    }

    /**
     * 오늘 기준 이번달 공과금 납입 예정액
     * @param cNo 고객번호
     * @return BigDecimal
     */
    public BigDecimal sumBillMonthlyDue(int cNo) {
        return queryFactory
                .select(billInvoice.biAmount.sum().coalesce(BigDecimal.ZERO))
                .from(billInvoice)
                .join(utilityBill).on(billInvoice.ubNo.eq(utilityBill.ubNo))
                .where(
                        utilityBill.cNo.eq(cNo),
                        billInvoice.biStatus.eq("READY"),
                        billInvoice.biDueAt.isNull()
                )
                .fetchOne();
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

    public Optional<LocalDate> getLastSnapshotDate() {
        LocalDate last = queryFactory
                .select(assetDailySnapshot.adsYmd.max())
                .from(assetDailySnapshot)
                .fetchOne();
        return Optional.ofNullable(last);
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
     * 잔액이 가장 많은 적금 조회
     * @param cNo 고객번호
     * @return TopInstallmentDto
     */
    public Optional<TopInstallmentDto> getTopInstallment(int cNo) {
        TopInstallmentDto installmentDto = queryFactory
                .select(Projections.constructor(TopInstallmentDto.class,
                                productInstallmentList.ipName,          // 상품명
                                productInstallment.iMonth,              // 가입개월
                                productInstallmentList.ipRate,          // 이율
                                productInstallment.iAmount,             // 잔액
                                productInstallment.iPrincipalBal        // 월 납입액
                ))
                .from(productInstallment)
                .join(productInstallmentList)
                .on(productInstallment.ipNo.eq(productInstallmentList.ipNo))
                .where(
                        productInstallment.cNo.eq(cNo),
                        productInstallment.iStatus.in("ACTIVE", "COMPLETE")
                )
                .orderBy(productInstallment.iAmount.desc())
                .limit(1)
                .fetchOne();

        return Optional.ofNullable(installmentDto);
    }

    /**
     * 잔액이 가장 많은 예금 조회
     * @param cNo 고객번호
     * @return TopDepositDto
     */
    public Optional<TopDepositDto> getTopDeposit(int cNo) {
        TopDepositDto depositDto = queryFactory
                .select(Projections.constructor(TopDepositDto.class,
                        productDepositList.dpName,
                        productDeposit.dPeriod,
                        productDeposit.dApy,
                        productDeposit.dAmount
                ))
                .from(productDeposit)
                .join(productDepositList)
                .on(productDeposit.dpNo.eq(productDepositList.dpNo))
                .where(
                        productDeposit.cNo.eq(cNo),
                        productDeposit.dStatus.in("ACTIVE", "NONE")
                )
                .orderBy(productDeposit.dAmount.desc())
                .limit(1)
                .fetchOne();

        return Optional.ofNullable(depositDto);
    }

    /**
     * 잔액이 가장 많은 대출 조회
     * @param cNo 고객번호
     * @return TopLoanDto
     */
    public Optional<TopLoanDto> getTopLoan(int cNo) {
        TopLoanDto row = queryFactory
                .select(Projections.constructor(TopLoanDto.class,
                        loanProduct.loanName,        // 상품명
                        loan.termMonth,             // 가입개월
                        loan.interestRate,          // 금리(연, %)
                        loan.balance                // 잔액
                ))
                .from(loan)
                .join(loanProduct).on(loan.lpdNo.eq(loanProduct.loanNo))
                .where(
                        loan.cNo.eq(cNo),
                        loan.status.eq("ACTIVE")
                )
                .orderBy(loan.balance.desc())
                .limit(1)
                .fetchOne();

        return Optional.ofNullable(row);
    }
}
