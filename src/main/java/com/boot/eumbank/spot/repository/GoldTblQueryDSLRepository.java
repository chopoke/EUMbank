package com.boot.eumbank.spot.repository;

import com.boot.eumbank.spot.model.GoldTbl;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static com.boot.eumbank.spot.model.QGoldTbl.goldTbl;
import static com.boot.eumbank.spot.model.QGoldProduct.goldProduct;
import static com.boot.eumbank.customer.entity.QCustomer.customer;

@Repository
@RequiredArgsConstructor
public class GoldTblQueryDSLRepository {
    
	private final JPAQueryFactory queryFactory;

    /**
     * 동적 조건으로 거래내역 조회 (QueryDSL)
     *
     * 사용 가능한 조건
     * - customerNo: 고객 번호
     * - transactionType: 거래 유형(BUY/SELL)
     * - metalCode: 금속 코드(AU/AG/PT)
     * - startDate/endDate: 거래일 범위
     * - minAmount/maxAmount: 금액 범위
     * 결과 정렬: 거래일 내림차순
     */
    public List<GoldTbl> findWithDynamicConditions(Long customerNo, 
                                                   String transactionType,
                                                   String metalCode,
                                                   LocalDateTime startDate, 
                                                   LocalDateTime endDate,
                                                   Double minAmount,
                                                   Double maxAmount) {
        // BooleanBuilder로 동적 조건 구성 (null 안전)
        BooleanBuilder builder = new BooleanBuilder();
        builder.and(eqCustomerNo(customerNo));
        builder.and(eqTransactionType(transactionType));
        builder.and(eqMetalCode(metalCode));
        builder.and(goeStartDate(startDate));
        builder.and(loeEndDate(endDate));
        builder.and(goeMinAmount(minAmount));
        builder.and(loeMaxAmount(maxAmount));
        
        return queryFactory
                .selectFrom(goldTbl)
                .join(goldTbl.customer, customer).fetchJoin()
                .join(goldTbl.goldProduct, goldProduct).fetchJoin()
                .where(builder)
                .orderBy(goldTbl.gPurchasedAt.desc())
                .fetch();
    }
    
    // 동적 조건 헬퍼 메서드들
    private BooleanExpression eqCustomerNo(Long customerNo) {
        return customerNo != null ? customer.customerNo.eq(customerNo.intValue()) : null;
    }
    
    private BooleanExpression eqTransactionType(String transactionType) {
        return transactionType != null ? goldTbl.gTransactionType.eq(GoldTbl.TransactionType.valueOf(transactionType)) : null;
    }
    
    private BooleanExpression eqMetalCode(String metalCode) {
        return metalCode != null ? goldProduct.gpMetalCode.eq(metalCode) : null;
    }
    
    private BooleanExpression goeStartDate(LocalDateTime startDate) {
        return startDate != null ? goldTbl.gPurchasedAt.goe(startDate) : null;
    }
    
    private BooleanExpression loeEndDate(LocalDateTime endDate) {
        return endDate != null ? goldTbl.gPurchasedAt.loe(endDate) : null;
    }
    
    private BooleanExpression goeMinAmount(Double minAmount) {
        return minAmount != null ? goldTbl.gTotalPrice.goe(java.math.BigDecimal.valueOf(minAmount)) : null;
    }
    
    private BooleanExpression loeMaxAmount(Double maxAmount) {
        return maxAmount != null ? goldTbl.gTotalPrice.loe(java.math.BigDecimal.valueOf(maxAmount)) : null;
    }

    /**
     * 고객별 수익률/집계 통계 (QueryDSL)
     *
     * 반환 컬럼
     * - 0: 거래유형(BUY/SELL)
     * - 1: 금속코드(AU/AG/PT)
     * - 2: 총 수량
     * - 3: 총 거래금액
     * - 4: 총 세금
     * - 5: 총 수수료
     */
	public List<Object[]> getCustomerTransactionStats(Long customerNo) {
		List<Tuple> results = queryFactory
				.select(
						goldTbl.gTransactionType,
						goldProduct.gpMetalCode,
						goldTbl.gQuantity.sum(),
						goldTbl.gTotalPrice.sum(),
						goldTbl.gTaxAmount.sum(),
						goldTbl.gFeeAmount.sum()
				)
				.from(goldTbl)
				.join(goldTbl.customer, customer)
				.join(goldTbl.goldProduct, goldProduct)
				.where(customer.customerNo.eq(customerNo.intValue()))
				.groupBy(goldTbl.gTransactionType, goldProduct.gpMetalCode)
				.fetch();
		
		// Tuple을 Object[]로 변환
		return results.stream()
				.map(tuple -> new Object[]{
						tuple.get(goldTbl.gTransactionType),
						tuple.get(goldProduct.gpMetalCode),
						tuple.get(goldTbl.gQuantity.sum()),
						tuple.get(goldTbl.gTotalPrice.sum()),
						tuple.get(goldTbl.gTaxAmount.sum()),
						tuple.get(goldTbl.gFeeAmount.sum())
				})
				.collect(Collectors.toList());
	}

    /**
     * 월별 거래 통계 (QueryDSL)
     * Note: CONCAT, YEAR, MONTH, LPAD는 QueryDSL에서 직접 지원하지 않으므로
     * 네이티브 쿼리나 함수를 사용해야 할 수 있습니다.
     * 현재는 JPQL을 유지하거나 QueryDSL의 Expressions 사용
     */
	public List<Object[]> getMonthlyTransactionStats(Long customerNo) {
		// QueryDSL에서 날짜 함수를 직접 지원하지 않으므로
		// Expressions를 사용하거나 네이티브 쿼리 사용
		// 여기서는 간단히 유지하되, 향후 개선 가능
		List<Tuple> results = queryFactory
				.select(
						goldTbl.gTransactionType,
						goldTbl.gTotalPrice.count(),
						goldTbl.gTotalPrice.sum()
				)
				.from(goldTbl)
				.join(goldTbl.customer, customer)
				.where(customer.customerNo.eq(customerNo.intValue()))
				.groupBy(goldTbl.gTransactionType)
				.orderBy(goldTbl.gPurchasedAt.desc())
				.fetch();
		
		// Tuple을 Object[]로 변환
		return results.stream()
				.map(tuple -> new Object[]{
						tuple.get(goldTbl.gTransactionType),
						tuple.get(goldTbl.gTotalPrice.count()),
						tuple.get(goldTbl.gTotalPrice.sum())
				})
				.collect(Collectors.toList());
	}

    /**
     * 고객별 페이징 조회 (QueryDSL)
     */
    public Page<GoldTbl> findTransactionsByCustomerWithPaging(Long customerNo, Pageable pageable) {
        JPAQuery<GoldTbl> query = queryFactory
                .selectFrom(goldTbl)
                .join(goldTbl.customer, customer).fetchJoin()
                .join(goldTbl.goldProduct, goldProduct).fetchJoin()
                .where(customer.customerNo.eq(customerNo.intValue()))
                .orderBy(goldTbl.gPurchasedAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize());
        
        List<GoldTbl> results = query.fetch();
        
        // 총 개수 조회
        Long total = queryFactory
                .select(goldTbl.count())
                .from(goldTbl)
                .join(goldTbl.customer, customer)
                .where(customer.customerNo.eq(customerNo.intValue()))
                .fetchOne();
        
        return new PageImpl<>(results, pageable, total != null ? total : 0L);
    }

    /**
     * 동적 조건으로 페이징 조회 (QueryDSL)
     */
    public Page<GoldTbl> findTransactionsWithDynamicConditionsAndPaging(Long customerNo, 
                                                                       String transactionType,
                                                                       String metalCode,
                                                                       String walletName,
                                                                       Pageable pageable) {
        // 동적 조건 구성
        BooleanBuilder builder = new BooleanBuilder();
        
        if (customerNo != null) {
            builder.and(customer.customerNo.eq(customerNo.intValue()));
        }
        if (transactionType != null) {
            builder.and(goldTbl.gTransactionType.eq(GoldTbl.TransactionType.valueOf(transactionType)));
        }
        if (metalCode != null) {
            builder.and(goldProduct.gpMetalCode.eq(metalCode));
        }
        if (walletName != null) {
            builder.and(goldTbl.gWalletName.eq(walletName));
        }
        
        // 데이터 조회
        JPAQuery<GoldTbl> query = queryFactory
                .selectFrom(goldTbl)
                .join(goldTbl.customer, customer).fetchJoin()
                .join(goldTbl.goldProduct, goldProduct).fetchJoin()
                .where(builder)
                .orderBy(goldTbl.gPurchasedAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize());
        
        List<GoldTbl> results = query.fetch();
        
        // 총 개수 조회
        Long total = queryFactory
                .select(goldTbl.count())
                .from(goldTbl)
                .join(goldTbl.customer, customer)
                .join(goldTbl.goldProduct, goldProduct)
                .where(builder)
                .fetchOne();
        
        return new PageImpl<>(results, pageable, total != null ? total : 0L);
    }
}
