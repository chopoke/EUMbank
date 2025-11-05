// src/main/java/com/boot/eumbank/product/controller/InstallmentManagementController.java
package com.boot.eumbank.productadmin.controller;


import com.boot.eumbank.product.entity.product.ProductInstallmentList;
import com.boot.eumbank.productadmin.dto.MyInstallmentDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.dto.StatusChangeRequest;
import com.boot.eumbank.productadmin.service.InstallmentManagementService;
import com.boot.eumbank.productadmin.service.InstallmentProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/installment-management")
@RequiredArgsConstructor
public class InstallmentManagementController {

    private final InstallmentManagementService installmentManagementService;
    private final InstallmentProductService installmentProductService;
    private final Logger logger = LoggerFactory.getLogger(InstallmentManagementController.class);

    /**
     * 고객의 가입한 적금 목록 조회
     */
    @GetMapping("/my-installments")
    public ResponseEntity<List<MyInstallmentDTO>> getMyInstallments() {
        logger.info("InstallmentManagementController => getMyInstallments()");
        List<MyInstallmentDTO> installments = installmentManagementService.getMyInstallments();
        return ResponseEntity.ok(installments);
    }

    /**
     * 적금 상태 변경
     */
    @PutMapping("/installments/{iNo}/status")
    public ResponseEntity<Void> changeInstallmentStatus(
            @PathVariable Integer iNo,
            @RequestBody StatusChangeRequest request) {
        logger.info("InstallmentManagementController => changeInstallmentStatus()");
        installmentManagementService.changeInstallmentStatus(iNo, request.getStatus());
        return ResponseEntity.ok().build();
    }

    /**
     * 적금 삭제
     */
    @DeleteMapping("/installments/{iNo}")
    public ResponseEntity<Void> deleteInstallment(@PathVariable Integer iNo) {
        logger.info("InstallmentManagementController => deleteInstallment()");
        installmentManagementService.deleteInstallment(iNo);
        return ResponseEntity.ok().build();
    }

    /**
     * 적금 상품 관리 목록 조회
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductManagementDTO>> getInstallmentProducts() {
        logger.info("InstallmentManagementController => getInstallmentProducts()");
        List<ProductManagementDTO> products = installmentManagementService.getInstallmentProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * 적금 상품 활성화/비활성화
     */
    @PutMapping("/products/{ipNo}/toggle-status")
    public ResponseEntity<Void> toggleProductStatus(@PathVariable Integer ipNo) {
        logger.info("InstallmentManagementController => toggleProductStatus()");
        installmentManagementService.toggleProductStatus(ipNo);
        return ResponseEntity.ok().build();
    }

    /**
     * 예금 상품 등록
     */
    @PostMapping("/register")
    public ResponseEntity<ProductInstallmentList> createProduct(@RequestBody ProductManagementDTO dto) {

        logger.info("DepositManagementController => createProduct()");

        logger.info("dto: {}", dto);

        ProductInstallmentList product = installmentProductService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }
}