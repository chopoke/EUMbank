package com.boot.eumbank.account.open.jpa.repository;

import com.boot.eumbank.account.open.dto.deposit.ProductDto;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.boot.eumbank.account.open.entity.QDepositProduct.depositProduct;
import static com.boot.eumbank.account.open.entity.QInstallmentProduct.installmentProduct;
import static com.boot.eumbank.account.open.entity.QAForeignProduct.aForeignProduct;

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
                        depositProduct.dpCode,
                        depositProduct.dpName,
                        depositProduct.dpEarlyTerminationRate.stringValue().append("%"), // 예시: 이율을 문자열로
                        depositProduct.dpMinAmount.stringValue().prepend("최소금액: ").append("원"),
                        Expressions.stringTemplate("{0}", "예금")// 카테고리
                ))
                .from(depositProduct)
                .where(depositProduct.dpIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 적금 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findInstallmentProducts() {
        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        installmentProduct.ipCode,
                        installmentProduct.ipName,
                        installmentProduct.ipEarlyTerminationRate.stringValue().append("%"),
                        installmentProduct.ipMinMonthlyAmount.stringValue().prepend("최소납입: 월 ").append("원"),
                        Expressions.stringTemplate("{0}", "적금")
                ))
                .from(installmentProduct)
                .where(installmentProduct.ipIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 외환 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findForeignProducts() {
        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        aForeignProduct.id.stringValue(),
                        aForeignProduct.curNm,
                        aForeignProduct.apy.stringValue().prepend("연 ").append("%"),
                        aForeignProduct.prodType, // 최소금액 대신 상품 타입으로 대체 (예시)
                        Expressions.stringTemplate("{0}", "외환")
                ))
                .from(aForeignProduct)
                // 외환 상품은 활성 상태 컬럼이 없으므로 조건 생략 (필요 시 추가)
                .fetch();
    }
}