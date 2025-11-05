package com.boot.eumbank.productadmin.service;

import com.boot.eumbank.product.entity.product.ProductInstallmentList;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.jpa.repository.ProductInstallmentListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstallmentProductService {
    
    private final ProductInstallmentListRepository installmentRepository;

    @Transactional
    public ProductInstallmentList create(ProductManagementDTO dto) {
        ProductInstallmentList product = ProductInstallmentList.builder()
                .ipCode(dto.getCode())
                .ipName(dto.getName())
                .ipDescription(dto.getDescription())
                .ipType(dto.getType())
                .ipMinMonths(dto.getMinMonths())
                .ipMaxMonths(dto.getMaxMonths())
                .ipMinMonthlyAmount(dto.getMinAmount())
                .ipMaxMonthlyAmount(dto.getMaxAmount())
                .ipRate(dto.getRate())
                .ipInterestPaymentType(dto.getPaymentType())
                .ipFeature(dto.getFeatures())
                .ipButtonText(dto.getButtonText())
                .ipHref(dto.getHref())
                .ipIsActive(dto.getIsActive())
                .ipCreatedAt(LocalDateTime.now())
                .ipUpdatedAt(LocalDateTime.now())
                .build();
        
        return installmentRepository.save(product);
    }

}