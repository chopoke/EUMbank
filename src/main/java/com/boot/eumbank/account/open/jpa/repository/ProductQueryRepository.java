package com.boot.eumbank.account.open.jpa.repository;

import com.boot.eumbank.deposit.dto.deposit.ProductDto;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.boot.eumbank.deposit.entity.deposit.QProductForeignList.productForeignList;
import static com.boot.eumbank.deposit.entity.deposit.QProductDepositList.productDepositList;
import static com.boot.eumbank.deposit.entity.deposit.QProductInstallmentList.productInstallmentList;

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
                        productDepositList.dpCode, // 상품코드
                        productDepositList.dpName, // 상품이름
                        productDepositList.dpType, // 타입 = 예금종류
                        productDepositList.dpDescription, // 상품설명
                        productDepositList.dpEarlyTerminationRate.stringValue().append("%"), // 예시: 이율을 문자열로
                        productDepositList.dpMaxAmount.stringValue().prepend("최대금액").append("원"),
                        productDepositList.dpMinAmount.stringValue().prepend("최소금액: ").append("원"),
                        productDepositList.dpMinMonths, // 최소 개월수
                        productDepositList.dpMaxMonths, // 최대 개월수
                        productDepositList.dpInterestPaymentType.stringValue().prepend("지불방식"),
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
                        productInstallmentList.ipType,
                        productInstallmentList.ipDescription, // 상품 설명
                        productInstallmentList.ipEarlyTerminationRate.stringValue().append("%"),
                        productInstallmentList.ipMinMonthlyAmount.stringValue().prepend("최소금액").append("원"),
                        productInstallmentList.ipMaxMonthlyAmount.stringValue().prepend("최대금액").append("원"),
                        productInstallmentList.ipMinMonths,
                        productInstallmentList.ipMaxMonths,
                        productInstallmentList.ipInterestPaymentType.stringValue().prepend("지불방식"),
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
                        productForeignList.fpCode,
                        productForeignList.fpName,
                        productForeignList.prodType,
                        productForeignList.fpDescription, // 설명
                        productForeignList.apy.stringValue().prepend("연 ").append("%"),
                        Expressions.asString("제한 없음"),               // 6. maxAmount (String) - 기본값
                        Expressions.asString("제한 없음"),
                        Expressions.nullExpression(Integer.class),      // 8. minMonths (Integer) - null 처리
                        Expressions.nullExpression(Integer.class),      // 9. maxMonths (Integer) - null 처리
                        Expressions.asString("해당 없음"),               // 10. paymentType (String) - 기본값
                        Expressions.stringTemplate("{0}", "외환")
                ))
                .from(productForeignList)
                // 외환 상품은 활성 상태 컬럼이 없으므로 조건 생략 (필요 시 추가)
                .fetch();
    }
}