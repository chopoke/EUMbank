// src/main/java/com/boot/eumbank/product/controller/DepositManagementController.java
package com.boot.eumbank.productadmin.controller;

import com.boot.eumbank.product.entity.product.ProductDepositList;
import com.boot.eumbank.productadmin.dto.MyDepositDTO;
import com.boot.eumbank.productadmin.dto.ProductManagementDTO;
import com.boot.eumbank.productadmin.dto.StatusChangeRequest;
import com.boot.eumbank.productadmin.service.DepositManagementService;
import com.boot.eumbank.productadmin.service.DepositProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deposit-management")
@RequiredArgsConstructor
public class DepositManagementController {

    private final DepositManagementService depositManagementService;

    private final DepositProductService depositProductService;

    private final Logger logger = LoggerFactory.getLogger(DepositManagementController.class);

    /**
     * 고객의 가입한 예금 목록 조회
     */
    @GetMapping("/my-deposits")
    public ResponseEntity<List<MyDepositDTO>> getMyDeposits() {
        logger.info("DepositManagementController => getMyDeposits()");
        List<MyDepositDTO> deposits = depositManagementService.getMyDeposits();
        return ResponseEntity.ok(deposits);
    }

    /**
     * 예금 상태 변경
     */
    @PutMapping("/deposits/{dNo}/status")
    public ResponseEntity<Void> changeDepositStatus(
            @PathVariable Integer dNo,
            @RequestBody StatusChangeRequest request) {
        logger.info("DepositManagementController => changeDepositStatus()");
        depositManagementService.changeDepositStatus(dNo, request.getStatus());
        return ResponseEntity.ok().build();
    }

    /**
     * 예금 삭제
     */
    @DeleteMapping("/deposits/{dNo}")
    public ResponseEntity<Void> deleteDeposit(@PathVariable Integer dNo) {
        logger.info("DepositManagementController => deleteDeposit()");
        depositManagementService.deleteDeposit(dNo);
        return ResponseEntity.ok().build();
    }

    /**
     * 예금 상품 관리 목록 조회
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductManagementDTO>> getDepositProducts() {
        logger.info("DepositManagementController => getDepositProducts()");
        List<ProductManagementDTO> products = depositManagementService.getDepositProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * 예금 상품 활성화/비활성화
     */
    @PutMapping("/products/{dpNo}/toggle-status")
    public ResponseEntity<Void> toggleProductStatus(@PathVariable Integer dpNo) {
        logger.info("DepositManagementController => toggleProductStatus()");
        depositManagementService.toggleProductStatus(dpNo);
        return ResponseEntity.ok().build();
    }

    /**
     * 예금 상품 등록
     */
    @PostMapping("/register")
    public ResponseEntity<ProductDepositList> createProduct(@RequestBody ProductManagementDTO dto) {

        logger.info("DepositManagementController => createProduct()");

        logger.info("dto: {}", dto);

        ProductDepositList product = depositProductService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }
}