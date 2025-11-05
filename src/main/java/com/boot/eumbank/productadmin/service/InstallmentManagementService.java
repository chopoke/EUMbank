// src/main/java/com/boot/eumbank/product/service/InstallmentManagementService.java
package com.boot.eumbank.productadmin.service;


import com.boot.eumbank.productadmin.dto.MyInstallmentDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.jpa.repository.InstallmentManagementQueryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstallmentManagementService {

    private final InstallmentManagementQueryRepository installmentManagementQueryRepository;
    private final Logger logger = LoggerFactory.getLogger(InstallmentManagementService.class);

    /**
     * 고객의 가입한 적금 목록 조회
     */
    public List<MyInstallmentDTO> getMyInstallments(Integer cNo) {
        logger.info("InstallmentManagementService => getMyInstallments()");
        return installmentManagementQueryRepository.findMyInstallments(cNo);
    }

    /**
     * 적금 상태 변경
     */
    @Transactional
    public void changeInstallmentStatus(Integer iNo, String status) {
        logger.info("InstallmentManagementService => changeInstallmentStatus()");
        installmentManagementQueryRepository.updateInstallmentStatus(iNo, status);
    }

    /**
     * 적금 삭제
     */
    @Transactional
    public void deleteInstallment(Integer iNo) {
        logger.info("InstallmentManagementService => deleteInstallment()");
        installmentManagementQueryRepository.deleteInstallment(iNo);
    }

    /**
     * 적금 상품 관리 목록 조회
     */
    public List<ProductManagementDTO> getInstallmentProducts() {
        logger.info("InstallmentManagementService => getInstallmentProducts()");
        return installmentManagementQueryRepository.findInstallmentProductsForManagement();
    }

    /**
     * 적금 상품 활성화/비활성화
     */
    @Transactional
    public void toggleProductStatus(Integer ipNo) {
        logger.info("InstallmentManagementService => toggleProductStatus()");
        installmentManagementQueryRepository.toggleInstallmentProductStatus(ipNo);
    }
}