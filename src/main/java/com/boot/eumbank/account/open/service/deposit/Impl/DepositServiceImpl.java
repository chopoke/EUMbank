package com.boot.eumbank.account.open.service.deposit.Impl;

import com.boot.eumbank.account.open.dto.deposit.ProductDto;
import com.boot.eumbank.account.open.jpa.repository.ProductQueryRepository;
import com.boot.eumbank.account.open.service.deposit.DepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepositServiceImpl implements DepositService {

    private final ProductQueryRepository productQueryRepository;

    public List<ProductDto> findAllProducts() {
        // 각 Repository 메소드를 호출하여 상품 종류별로 데이터를 조회합니다.
        List<ProductDto> depositProducts = productQueryRepository.findDepositProducts();
        List<ProductDto> installmentProducts = productQueryRepository.findInstallmentProducts();
        List<ProductDto> foreignProducts = productQueryRepository.findForeignProducts();

        // 조회된 모든 상품을 하나의 리스트로 합칩니다.
        List<ProductDto> allProducts = new ArrayList<>();
        allProducts.addAll(depositProducts);
        allProducts.addAll(installmentProducts);
        allProducts.addAll(foreignProducts);

        // DTO의 나머지 필드들(features, buttonText 등)을 채워줍니다.
        // 이 부분은 비즈니스 규칙에 따라 동적으로 설정할 수 있습니다.
        allProducts.forEach(this::setAdditionalProductDetails);

        // 프론트엔드에서 섞는 로직이 있지만, 백엔드에서 섞어서 내려주는 것도 좋은 방법입니다.
        Collections.shuffle(allProducts);

        return allProducts;
    }

    // DTO의 상세 정보를 채우는 헬퍼 메소드
    private void setAdditionalProductDetails(ProductDto product) {
        String category = product.getCategory();
        String id = product.getId();

        // 카테고리에 따라 다른 상세 정보를 설정합니다.
        switch (category) {
            case "예금":
                product.setButtonText("계좌 개설");
                product.setHref("/deposit/open/" + id);
                product.setFeatures(List.of("월 관리수수료 없음", "편리한 온라인 이체", "모바일로 바로 입금"));
                product.setType("D" + generateRandomNumber());
                break;
            case "적금":
                product.setButtonText("적금 가입");
                product.setHref("/savings/open/" + id);
                product.setFeatures(List.of("정기 납입", "만기시 높은 수익", "자동이체 서비스"));
                product.setType("S" + generateRandomNumber());
                break;
            case "외환":
                product.setButtonText("환전 신청");
                product.setHref("/fx/open/" + id);
                product.setFeatures(List.of("온라인 환전 신청", "공항 및 지점 수령", "실시간 환율 정보"));
                product.setType("F" + generateRandomNumber());
                break;
        }
    }

    private int generateRandomNumber() {
        return ThreadLocalRandom.current().nextInt(10000, 100000);
    }

}
