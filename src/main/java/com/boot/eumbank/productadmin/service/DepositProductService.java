package com.boot.eumbank.productadmin.service;

import com.boot.eumbank.product.entity.product.ProductDepositList;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.jpa.repository.ProductDepositListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepositProductService {
    
    private final ProductDepositListRepository depositRepository;

    @Transactional
    public ProductDepositList create(ProductManagementDTO dto) {
        ProductDepositList product = ProductDepositList.builder()
                .dpCode(dto.getCode())
                .dpName(dto.getName())
                .dpDescription(dto.getDescription())
                .dpType(dto.getType())
                .dpMinAmount(dto.getMinAmount())
                .dpMaxAmount(dto.getMaxAmount())
                .dpMinMonths(dto.getMinMonths())
                .dpMaxMonths(dto.getMaxMonths())
                .dpEarlyTerminationRate(dto.getEalryTerminationRate())
                .dpRate(dto.getRate())
                .dpFeature(dto.getFeatures())
                .dpButtonText(dto.getButtonText())
                .dpHref(dto.getHref())
                .dpIsActive(dto.getIsActive())
                .dpCreatedAt(LocalDateTime.now())
                .dpUpdatedAt(LocalDateTime.now())
                .build();
        
        return depositRepository.save(product);
    }
}