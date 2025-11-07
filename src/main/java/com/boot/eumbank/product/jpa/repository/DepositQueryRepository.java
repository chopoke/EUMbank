package com.boot.eumbank.product.jpa.repository;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.DepositSubscriptionRequestDto;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static com.boot.eumbank.account.open.entity.account.QAccount.account;
import static com.boot.eumbank.product.entity.product.QProductDeposit.productDeposit;
import static com.boot.eumbank.product.entity.product.QProductDepositList.productDepositList;

@Repository
@RequiredArgsConstructor
public class DepositQueryRepository {

    private final JPAQueryFactory queryFactory;

    private Logger logger = LoggerFactory.getLogger(DepositQueryRepository.class);

    /**
     * 예금 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findAllDepositProducts() {

        logger.info("DepositQueryRepository => findAllDepositProducts()");

        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productDepositList.dpNo,
                        productDepositList.dpCode, // 상품코드
                        productDepositList.dpName, // 상품이름
                        productDepositList.dpType, // 타입 = 예금종류
                        productDepositList.dpDescription, // 상품설명
                        productDepositList.dpRate.stringValue().append("%"), // 예시: 이율을 문자열로
                        productDepositList.dpMaxAmount.stringValue().prepend("최대금액").append("원"),
                        productDepositList.dpMinAmount.stringValue().prepend("최소금액: ").append("원"),
                        productDepositList.dpMinMonths, // 최소 개월수
                        productDepositList.dpMaxMonths, // 최대 개월수
                        productDepositList.dpInterestPaymentType.stringValue().prepend("지불방식"),
                        productDepositList.dpFeature,
                        productDepositList.dpHref,
                        productDepositList.dpButtonText,
                        Expressions.stringTemplate("{0}", "예금")// 카테고리
                ))
                .from(productDepositList)
                .where(productDepositList.dpIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 예금 상품의 특정 정보를 ProductDto 형태로 조회합니다.
     */
    public ProductDto findOneDepositProducts(String depositNo) {

        logger.info("DepositQueryRepository => findOneDepositProducts()");

        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productDepositList.dpNo,
                        productDepositList.dpCode,
                        productDepositList.dpName,
                        productDepositList.dpType,
                        productDepositList.dpDescription,
                        productDepositList.dpRate.stringValue(),
                        productDepositList.dpMaxAmount.stringValue(),
                        productDepositList.dpMinAmount.stringValue(),
                        productDepositList.dpMinMonths,
                        productDepositList.dpMaxMonths,
                        productDepositList.dpInterestPaymentType.stringValue(),
                        productDepositList.dpFeature,
                        productDepositList.dpHref,
                        productDepositList.dpButtonText,
                        Expressions.stringTemplate("{0}", "-")
                ))
                .from(productDepositList)
                .where(productDepositList.dpIsActive.eq("Y")
                        .and(productDepositList.dpNo.eq(Integer.valueOf(depositNo))))
                .fetchOne();
    }

    /**
     * 예금 상품 저장
     * @param requestDto
     * @return
     */
    public void depositSave(DepositSubscriptionRequestDto requestDto, Customer customer, ProductDto depositProducts, Account oneAccount) {

        logger.info("DepositQueryRepository => findOneDepositProducts()");

        logger.info("requestDto : " + requestDto);
        logger.info("customer : " + customer);
        logger.info("depositProducts : " + depositProducts);
        logger.info("oneAccount : " + oneAccount);

        queryFactory
                .insert(productDeposit)
                .columns(
                        productDeposit.dNo,
                        productDeposit.dpNo, // 상품 번호
                        productDeposit.cNo, // 고객 번호
                        productDeposit.aNo, // 계좌 일련번호
                        productDeposit.dId, // 예금 아이디
                        productDeposit.dAccountNo, // 예금계좌번호
                        productDeposit.dJoinDate, //
                        productDeposit.dMaturityDate,
                        productDeposit.dAmount,
                        productDeposit.dInterestRate,
                        productDeposit.dStatus,
                        productDeposit.dUpdatedAt,
                        productDeposit.dFreezeYn,
                        productDeposit.dDormantYn,
                        productDeposit.dApy,
                        productDeposit.dAccrInt,
                        productDeposit.dPrincipalBal,
                        productDeposit.aAccountNo,
                        productDeposit.dPeriod,
                        productDeposit.dExpectedMaturityAmount
                ).values(
                        null,
                        depositProducts.getNo(), // dposit_product_tbl dpNo
                        customer.getCustomerNo(),
                        oneAccount.getANo(),
                        depositProducts.getId(), // deposit_product_tbl dpId
                        requestDto.getDepositAccount(),
                        LocalDateTime.now(),                        // 6. dJoinDate - 가입일 (현재시간)
                        LocalDateTime.now().plusMonths(requestDto.getPeriod()), // 7. dMaturityDate - 만기일 (가입일 + 개월수)
                        0,                     // 8. dAmount - 예금액
                        new BigDecimal(depositProducts.getRate()),  // 9. dInterestRate - 이자율
                        "ACTIVE",                                   // 10. dStatus - 상태 (초기값: ACTIVE)
                        LocalDateTime.now(),                        // 11. dUpdatedAt - 수정일시
                        "N",                                        // 12. dFreezeYn - 동결여부 (초기값: N)
                        "N",                                        // 13. dDormantYn - 휴면여부 (초기값: N)
                        new BigDecimal(depositProducts.getRate()),  // 14. dApy - 연이율 (이자율과 동일하게 설정)
                        BigDecimal.ZERO,                            // 15. dAccrInt - 경과이자 (초기값: 0)
                        new BigDecimal(requestDto.getAmount()),      // 16. dPrincipalBal - 원금잔액 (초기 예금액)
                        oneAccount.getAccountNo(),
                        requestDto.getPeriod(),
                        requestDto.getExpectedMaturityAmount()
                ).execute();
    }

    /**
     * 예금 상품등록을 위한 특정 게좌 조회
     * @return
     */
    public Account findOneAccount(Customer customer, DepositSubscriptionRequestDto requestDto) {

        logger.info("AccountQueryRepository => findOneAccount()");

        return queryFactory
                .selectFrom(account)
                .where(account.cNo.eq(customer.getCustomerNo()).and(account.aNo.eq(Math.toIntExact(requestDto.getLinkedAccountAno()))))
                .fetchOne();

    }
}