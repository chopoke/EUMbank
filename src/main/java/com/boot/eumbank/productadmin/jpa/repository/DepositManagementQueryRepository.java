// src/main/java/com/boot/eumbank/product/jpa/repository/DepositQueryRepository.java
package com.boot.eumbank.productadmin.jpa.repository;


import com.boot.eumbank.productadmin.dto.MyDepositDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.boot.eumbank.product.entity.product.QProductDeposit.productDeposit;
import static com.boot.eumbank.product.entity.product.QProductDepositList.productDepositList;

@Repository
@RequiredArgsConstructor
public class DepositManagementQueryRepository {

    private final JPAQueryFactory queryFactory;
    private final Logger logger = LoggerFactory.getLogger(DepositManagementQueryRepository.class);
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 고객의 가입한 예금 목록 조회
     */
    public List<MyDepositDTO> findMyDeposits(Integer cNo) {
        logger.info("DepositManagementQueryRepository => findMyDeposits()");

        return queryFactory
                .select(Projections.constructor(MyDepositDTO.class,
                        productDeposit.dNo,
                        productDepositList.dpName,
                        productDeposit.dId,
                        productDeposit.dAccountNo,
                        productDeposit.dAmount,
                        productDeposit.dInterestRate,
                        productDeposit.dJoinDate.stringValue(),
                        productDeposit.dMaturityDate.stringValue(),
                        productDepositList.dpType,
                        productDeposit.dStatus,
                        productDeposit.dPeriod,
                        productDeposit.aAccountNo
                ))
                .from(productDeposit)
                .leftJoin(productDepositList)
                .on(productDeposit.dpNo.eq(productDepositList.dpNo))
                .where(productDeposit.cNo.eq(cNo))
                .orderBy(productDeposit.dJoinDate.desc())
                .fetch();
    }

    /**
     * 예금 상태 변경
     */
    public void updateDepositStatus(Integer dNo, String status) {
        logger.info("DepositManagementQueryRepository => updateDepositStatus()");

        queryFactory
                .update(productDeposit)
                .set(productDeposit.dStatus, status)
                .set(productDeposit.dDormantYn, "DORMANT".equals(status) ? "Y" : "N")
                .set(productDeposit.dFreezeYn, "SUSPENDED".equals(status) ? "Y" : "N")
                .where(productDeposit.dNo.eq(dNo))
                .execute();
    }

    /**
     * 예금 삭제
     */
    public void deleteDeposit(Integer dNo) {
        logger.info("DepositManagementQueryRepository => deleteDeposit()");

        queryFactory
                .delete(productDeposit)
                .where(productDeposit.dNo.eq(dNo))
                .execute();
    }

    /**
     * 예금 상품 관리 목록 조회
     */
    public List<ProductManagementDTO> findDepositProductsForManagement() {
        logger.info("DepositManagementQueryRepository => findDepositProductsForManagement()");

        return queryFactory
                .select(Projections.constructor(ProductManagementDTO.class,
                        productDepositList.dpNo,
                        productDepositList.dpCode,
                        productDepositList.dpName,
                        productDepositList.dpDescription,
                        productDepositList.dpType,
                        productDepositList.dpRate,
                        productDepositList.dpMinAmount,
                        productDepositList.dpMaxAmount,
                        productDepositList.dpMinMonths,
                        productDepositList.dpMaxMonths,
                        productDepositList.dpMinMonths.stringValue()
                                .concat("~")
                                .concat(productDepositList.dpMaxMonths.stringValue())
                                .concat("개월"),
                        productDepositList.dpInterestPaymentType,
                        productDepositList.dpIsActive,
                        productDepositList.dpFeature,
                        productDepositList.dpHref,
                        productDepositList.dpButtonText
                ))
                .from(productDepositList)
                .orderBy(productDepositList.dpCreatedAt.desc())
                .fetch();
    }

    /**
     * 예금 상품 활성화/비활성화
     */
    public void toggleDepositProductStatus(Integer dpNo) {
        logger.info("DepositManagementQueryRepository => toggleDepositProductStatus()");

        // 현재 상태 조회
        String currentStatus = queryFactory
                .select(productDepositList.dpIsActive)
                .from(productDepositList)
                .where(productDepositList.dpNo.eq(dpNo))
                .fetchOne();

        // 반대 상태로 변경
        String newStatus = "Y".equals(currentStatus) ? "N" : "Y";

        queryFactory
                .update(productDepositList)
                .set(productDepositList.dpIsActive, newStatus)
                .where(productDepositList.dpNo.eq(dpNo))
                .execute();
    }
}