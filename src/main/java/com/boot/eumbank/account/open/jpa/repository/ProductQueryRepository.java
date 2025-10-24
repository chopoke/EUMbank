package com.boot.eumbank.account.open.jpa.repository;

import com.boot.eumbank.account.open.dto.deposit.ProductDto;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.boot.eumbank.account.open.entity.deposit.QProductForeignList.productForeignList;
import static com.boot.eumbank.account.open.entity.deposit.QProductDepositList.productDepositList;
import static com.boot.eumbank.account.open.entity.deposit.QProductInstallmentList.productInstallmentList;

@Repository
@RequiredArgsConstructor
public class ProductQueryRepository {

    private final JPAQueryFactory queryFactory;

    /**
     * 예금 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findDepositProducts() {
        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productDepositList.dpCode,
                        productDepositList.dpName,
                        productDepositList.dpEarlyTerminationRate.stringValue().append("%"), // 예시: 이율을 문자열로
                        productDepositList.dpMinAmount.stringValue().prepend("최소금액: ").append("원"),
                        Expressions.stringTemplate("{0}", "예금")// 카테고리
                ))
                .from(productDepositList)
                .where(productDepositList.dpIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 적금 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findInstallmentProducts() {
        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productInstallmentList.ipCode,
                        productInstallmentList.ipName,
                        productInstallmentList.ipEarlyTerminationRate.stringValue().append("%"),
                        productInstallmentList.ipMinMonthlyAmount.stringValue().prepend("최소납입: 월 ").append("원"),
                        Expressions.stringTemplate("{0}", "적금")
                ))
                .from(productInstallmentList)
                .where(productInstallmentList.ipIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 외환 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findForeignProducts() {
        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productForeignList.id.stringValue(),
                        productForeignList.curNm,
                        productForeignList.apy.stringValue().prepend("연 ").append("%"),
                        productForeignList.prodType, // 최소금액 대신 상품 타입으로 대체 (예시)
                        Expressions.stringTemplate("{0}", "외환")
                ))
                .from(productForeignList)
                // 외환 상품은 활성 상태 컬럼이 없으므로 조건 생략 (필요 시 추가)
                .fetch();
    }
}