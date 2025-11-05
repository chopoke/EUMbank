// src/main/java/com/boot/eumbank/product/service/DepositManagementService.java
package com.boot.eumbank.productadmin.service;


import com.boot.eumbank.productadmin.dto.MyDepositDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.jpa.repository.DepositManagementQueryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepositManagementService {

    private final DepositManagementQueryRepository depositManagementQueryRepository;
    private final Logger logger = LoggerFactory.getLogger(DepositManagementService.class);

    /**
     * 고객의 가입한 예금 목록 조회
     */
    public List<MyDepositDTO> getMyDeposits(Integer cNo) {
        logger.info("DepositManagementService => getMyDeposits()");
        return depositManagementQueryRepository.findMyDeposits(cNo);
    }

    /**
     * 예금 상태 변경
     */
    @Transactional
    public void changeDepositStatus(Integer dNo, String status) {
        logger.info("DepositManagementService => changeDepositStatus()");
        depositManagementQueryRepository.updateDepositStatus(dNo, status);
    }

    /**
     * 예금 삭제
     */
    @Transactional
    public void deleteDeposit(Integer dNo) {
        logger.info("DepositManagementService => deleteDeposit()");
        depositManagementQueryRepository.deleteDeposit(dNo);
    }

    /**
     * 예금 상품 관리 목록 조회
     */
    public List<ProductManagementDTO> getDepositProducts() {
        logger.info("DepositManagementService => getDepositProducts()");
        return depositManagementQueryRepository.findDepositProductsForManagement();
    }

    /**
     * 예금 상품 활성화/비활성화
     */
    @Transactional
    public void toggleProductStatus(Integer dpNo) {
        logger.info("DepositManagementService => toggleProductStatus()");
        depositManagementQueryRepository.toggleDepositProductStatus(dpNo);
    }
}