package com.boot.eumbank.product.service.product.Impl;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.jpa.repository.AccountQueryRepository;
import com.boot.eumbank.product.jpa.repository.DepositQueryRepository;
import com.boot.eumbank.product.jpa.repository.InstallQueryRepository;
import com.boot.eumbank.product.service.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final DepositQueryRepository depositQueryRepository;

    private final InstallQueryRepository installQueryRepository;

    private final AccountQueryRepository accountQueryRepository;

    public List<ProductDto> findAllProducts() {
        // 각 Repository 메소드를 호출하여 상품 종류별로 데이터를 조회합니다.
        List<ProductDto> depositProducts = depositQueryRepository.findAllDepositProducts();
        List<ProductDto> installmentProducts = installQueryRepository.findInstallmentProducts();

        // 조회된 모든 상품을 하나의 리스트로 합칩니다.
        List<ProductDto> allProducts = new ArrayList<>();
        allProducts.addAll(depositProducts);
        allProducts.addAll(installmentProducts);

        // 프론트엔드에서 섞는 로직이 있지만, 백엔드에서 섞어서 내려주는 것도 좋은 방법입니다.
        Collections.shuffle(allProducts);

        return allProducts;
    }

    public List<Account> checkAccountExists(Integer customer) {

        return accountQueryRepository.findAllAccount(customer);

    }
}
