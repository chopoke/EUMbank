package com.boot.eumbank.product.controller;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProduuctController {

    private final ProductService productService;

    boolean result = false;

    /**
     * 가입화면에서 외환, 비활성화를 뺀 계좌 목록 가져오기
     * @return
     */
    @GetMapping("/productsList")
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = productService.findAllProducts();
        return ResponseEntity.ok(products);
    }

    /**\
     * 상품 목록 권한 추가하기
     * @return
     */
    @GetMapping("/check-exists")
    public ResponseEntity<Map<String, Boolean>> checkAccountExists() {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Customer customer = (Customer) authentication.getPrincipal();

            List<Account> accounts = productService.checkAccountExists(customer.getCustomerNo());

            result = accounts.size() > 0 ? true : false;

            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", result);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
