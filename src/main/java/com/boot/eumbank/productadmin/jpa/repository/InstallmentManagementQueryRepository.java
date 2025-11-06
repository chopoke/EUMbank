// src/main/java/com/boot/eumbank/product/jpa/repository/InstallmentManagementQueryRepository.java
package com.boot.eumbank.productadmin.jpa.repository;

import com.boot.eumbank.productadmin.dto.MyInstallmentDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.boot.eumbank.product.entity.product.QProductInstallment.productInstallment;
import static com.boot.eumbank.product.entity.product.QProductInstallmentList.productInstallmentList;

@Repository
@RequiredArgsConstructor
public class InstallmentManagementQueryRepository {

    private final JPAQueryFactory queryFactory;
    private final Logger logger = LoggerFactory.getLogger(InstallmentManagementQueryRepository.class);
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 고객의 가입한 적금 목록 조회
     */
    public List<MyInstallmentDTO> findMyInstallments() {
        logger.info("InstallmentManagementQueryRepository => findMyInstallments()");

        return queryFactory
                .select(Projections.constructor(MyInstallmentDTO.class,
                        productInstallment.iNo,
                        productInstallmentList.ipName,
                        productInstallment.iId,
                        productInstallment.iAccountNo,
                        productInstallment.iAmount,
                        productInstallment.iInterestRate,
                        productInstallment.iJoinDate.stringValue(),
                        productInstallment.iMaturityDate.stringValue(),
                        productInstallmentList.ipType,
                        productInstallment.iStatus,
                        productInstallment.iMonth,
                        productInstallment.aAccountNo,
                        productInstallment.iPaidInstallments
                ))
                .from(productInstallment)
                .leftJoin(productInstallmentList)
                .on(productInstallment.ipNo.eq(productInstallmentList.ipNo))
                .orderBy(productInstallment.iJoinDate.desc())
                .fetch();
    }

    /**
     * 적금 상태 변경
     */
    public void updateInstallmentStatus(Integer iNo, String status) {
        logger.info("InstallmentManagementQueryRepository => updateInstallmentStatus()");

        queryFactory
                .update(productInstallment)
                .set(productInstallment.iStatus, status)
                .where(productInstallment.iNo.eq(iNo))
                .execute();
    }

    /**
     * 적금 삭제
     */
    public void deleteInstallment(Integer iNo) {
        logger.info("InstallmentManagementQueryRepository => deleteInstallment()");

        queryFactory
                .delete(productInstallment)
                .where(productInstallment.iNo.eq(iNo))
                .execute();
    }

    /**
     * 적금 상품 관리 목록 조회
     */
    public List<ProductManagementDTO> findInstallmentProductsForManagement() {
        logger.info("InstallmentManagementQueryRepository => findInstallmentProductsForManagement()");

        return queryFactory
                .select(Projections.constructor(ProductManagementDTO.class,
                        productInstallmentList.ipNo,
                        productInstallmentList.ipCode,
                        productInstallmentList.ipName,
                        productInstallmentList.ipDescription,
                        productInstallmentList.ipType,
                        productInstallmentList.ipRate,
                        productInstallmentList.ipMinMonthlyAmount,
                        productInstallmentList.ipMaxMonthlyAmount,
                        productInstallmentList.ipMinMonths,
                        productInstallmentList.ipMaxMonths,
                        productInstallmentList.ipMinMonths.stringValue()
                                .concat("~")
                                .concat(productInstallmentList.ipMaxMonths.stringValue())
                                .concat("개월"),
                        productInstallmentList.ipEarlyTerminationRate,
                        productInstallmentList.ipInterestPaymentType,
                        productInstallmentList.ipIsActive,
                        productInstallmentList.ipFeature,
                        productInstallmentList.ipHref,
                        productInstallmentList.ipButtonText
                ))
                .from(productInstallmentList)
                .orderBy(productInstallmentList.ipCreatedAt.desc())
                .fetch();
    }

    /**
     * 적금 상품 활성화/비활성화
     */
    public void toggleInstallmentProductStatus(Integer ipNo) {
        logger.info("InstallmentManagementQueryRepository => toggleInstallmentProductStatus()");

        String currentStatus = queryFactory
                .select(productInstallmentList.ipIsActive)
                .from(productInstallmentList)
                .where(productInstallmentList.ipNo.eq(ipNo))
                .fetchOne();

        String newStatus = "Y".equals(currentStatus) ? "N" : "Y";

        queryFactory
                .update(productInstallmentList)
                .set(productInstallmentList.ipIsActive, newStatus)
                .where(productInstallmentList.ipNo.eq(ipNo))
                .execute();
    }
}