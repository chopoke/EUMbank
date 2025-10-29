package com.boot.eumbank.product.jpa.repository;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.InstallSubscriptionRequestDto;
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

import static com.boot.eumbank.product.entity.product.QProductInstallment.productInstallment;
import static com.boot.eumbank.product.entity.product.QProductInstallmentList.productInstallmentList;

@Repository
@RequiredArgsConstructor
public class InstallQueryRepository {

    private final JPAQueryFactory queryFactory;

    private Logger logger = LoggerFactory.getLogger(DepositQueryRepository.class);

    /**
     * 적금 상품 목록을 ProductDto 형태로 조회합니다.
     */
    public List<ProductDto> findInstallmentProducts() {

        logger.info("InstallQueryRepository => findInstallmentProducts()");

        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productInstallmentList.ipNo,
                        productInstallmentList.ipCode,
                        productInstallmentList.ipName,
                        productInstallmentList.ipType,
                        productInstallmentList.ipDescription, // 상품 설명
                        productInstallmentList.ipEarlyTerminationRate.stringValue().append("%"),
                        productInstallmentList.ipMaxMonthlyAmount.stringValue().prepend("최대금액").append("원"),
                        productInstallmentList.ipMinMonthlyAmount.stringValue().prepend("최소금액").append("원"),
                        productInstallmentList.ipMinMonths,
                        productInstallmentList.ipMaxMonths,
                        productInstallmentList.ipInterestPaymentType.stringValue().prepend("지불방식"),
                        productInstallmentList.ipFeature,
                        productInstallmentList.ipHref,
                        productInstallmentList.ipButtonText,
                        Expressions.stringTemplate("{0}", "적금")
                ))
                .from(productInstallmentList)
                .where(productInstallmentList.ipIsActive.eq("Y"))
                .fetch();
    }

    /**
     * 예금 상품의 전체 정보를 ProductDto 형태로 조회합니다.
     */
    public ProductDto findOneInstallProducts(String savingNo) {

        logger.info("InstallQueryRepository => findOneInstallProducts()");

        return queryFactory
                .select(Projections.constructor(ProductDto.class,
                        productInstallmentList.ipNo,
                        productInstallmentList.ipCode,
                        productInstallmentList.ipName,
                        productInstallmentList.ipType,
                        productInstallmentList.ipDescription,
                        productInstallmentList.ipEarlyTerminationRate.stringValue(),
                        productInstallmentList.ipMaxMonthlyAmount.stringValue(),
                        productInstallmentList.ipMinMonthlyAmount.stringValue(),
                        productInstallmentList.ipMinMonths,
                        productInstallmentList.ipMaxMonths,
                        productInstallmentList.ipInterestPaymentType.stringValue(),
                        productInstallmentList.ipFeature,
                        productInstallmentList.ipHref,
                        productInstallmentList.ipButtonText,
                        Expressions.stringTemplate("{0}", "-")
                ))
                .from(productInstallmentList)
                .where(productInstallmentList.ipIsActive.eq("Y")
                        .and(productInstallmentList.ipNo.eq(Integer.valueOf(savingNo))))
                .fetchOne();
    }

    /**
     * 예금 상품 저장
     * @param installDto
     * @return
     */
    public void installSave(InstallSubscriptionRequestDto installDto, Customer customer, ProductDto installProducts, Account oneAccount) {

        logger.info("InstallQueryRepository  => installmentSave()");

        logger.info("requestDto : " + installDto);
        logger.info("customer : " + customer);
        logger.info("depositProducts : " + installProducts);
        logger.info("oneAccount : " + oneAccount);

        logger.info(oneAccount.getAccountNo());

        queryFactory
                .insert(productInstallment)
                .columns(
                        productInstallment.iNo,                    // 1. 적금번호 (auto_increment)
                        productInstallment.ipNo,                   // 2. 적금상품번호
                        productInstallment.cNo,                    // 3. 고객번호
                        productInstallment.aNo,                    // 4. 계좌번호ID
                        productInstallment.iId,                    // 5. 적금ID
                        productInstallment.iAccountNo,             // 6. 계좌번호
                        productInstallment.iJoinDate,              // 7. 가입일
                        productInstallment.iMaturityDate,          // 8. 만기일
                        productInstallment.iMonth,                 // 9. 가입개월
                        productInstallment.iMonthlyAmt,            // 10. 월납입금
                        productInstallment.iCurrency,              // 11. 통화
                        productInstallment.iInterestRate,          // 12. 연이율
                        productInstallment.iPayDay,                // 13. 납입일
                        productInstallment.iStatus,                // 14. 상태
                        productInstallment.iPaidInstallments,      // 15. 납입회차
                        productInstallment.iPrincipalPaid,         // 16. 납입원금
                        productInstallment.iInterestAccrued,       // 17. 미지급이자누계
                        productInstallment.iBonusAmt,              // 18. 우대금액
                        productInstallment.iArrearsCnt,            // 19. 연체회차
                        productInstallment.iArrearsAmt,            // 20. 연체금액
                        productInstallment.iUpdatedAt,              // 21. 수정일
                        productInstallment.aAccountNo
                ).values(
                        null,
                        installProducts.getNo(), // dposit_product_tbl dpNo
                        customer.getCustomerNo(),
                        oneAccount.getANo(),
                        installProducts.getId(), // deposit_product_tbl dpId
                        installDto.getSavingAccount(),
                        LocalDateTime.now(),                        // 6. dJoinDate - 가입일 (현재시간)
                        LocalDateTime.now().plusMonths(installDto.getPeriod()), // 7. dMaturityDate - 만기일 (가입일 + 개월수)
                        installDto.getPeriod(),                                         // 9. iMonth - 가입개월
                        installDto.getAmount().intValue(),
                        "KRW",                                                          // 11. iCurrency - 통화
                        new BigDecimal(installProducts.getRate()),                      // 12. iInterestRate - 연이율
                        installDto.getPayDay(),    // 13. iPayDay - 납입일 (기본값: 1일)
                        "ACTIVE",                                                       // 14. iStatus - 상태 (초기값: ACTIVE)
                        0,                                                              // 15. iPaidInstallments - 납입회차 (초기값: 0)
                        0,                                                              // 16. iPrincipalPaid - 납입원금 (초기값: 0)
                        0,                                                              // 17. iInterestAccrued - 미지급이자누계 (초기값: 0)
                        BigDecimal.ZERO,                                                // 18. iBonusAmt - 우대금액 (초기값: 0)
                        0,                                                              // 19. iArrearsCnt - 연체회차 (초기값: 0)
                        BigDecimal.ZERO,                                                // 20. iArrearsAmt - 연체금액 (초기값: 0)
                        LocalDateTime.now(),
                        oneAccount.getAccountNo()
                ).execute();
    }

}
