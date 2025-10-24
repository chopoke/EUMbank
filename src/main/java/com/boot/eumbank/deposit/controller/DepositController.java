package com.boot.eumbank.deposit.controller;

import com.boot.eumbank.deposit.dto.deposit.ProductDto;
import com.boot.eumbank.deposit.service.deposit.DepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/deposit")
@RequiredArgsConstructor
public class DepositController {

    private final DepositService depositService;

    @GetMapping("/productsList")
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = depositService.findAllProducts();
        return ResponseEntity.ok(products);
    }

}
