package com.boot.eumbank.deposit.service.deposit.Impl;

import com.boot.eumbank.deposit.dto.deposit.ProductDto;
import com.boot.eumbank.account.open.jpa.repository.ProductQueryRepository;
import com.boot.eumbank.deposit.service.deposit.DepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
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

        System.out.println(allProducts);

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


        List<String> depositFeatures = Arrays.asList(
                "월 관리수수료 없음", "편리한 온라인 이체", "모바일로 바로 입금", "24시간 고객지원",
                "높은 이자율 제공", "우선 고객 서비스", "무료 송금 서비스", "전담 상담사 배정",
                "기업 특화 서비스", "다중 사용자 권한", "당좌예금 연계", "자금 관리 리포트"
        );

        List<String> savingsFeatures = Arrays.asList(
                "정기 납입으로 목돈 마련", "만기 시 높은 수익률", "편리한 자동이체 서비스", "자유로운 납입 주기",
                "금액 조절 기능", "목표 설정 및 관리", "모바일 간편 관리", "청년 우대금리 혜택",
                "정부 지원 연계", "금융 교육 콘텐츠 제공", "미래 설계 무료 상담", "중도해지 시 낮은 손실"
        );

        List<String> fxFeatures = Arrays.asList(
                "온라인 환전 간편 신청", "공항 및 지점 수령 가능", "실시간 환율 정보 제공", "주요 통화 환율 우대",
                "빠르고 안전한 해외 송금", "전 세계 금융 네트워크", "모바일로 간편 송금", "송금 진행상황 실시간 조회",
                "환테크에 유리한 조건", "환차익 비과세 혜택", "다양한 통화 보유", "자유로운 입출금"
        );


        // 카테고리에 따라 다른 상세 정보를 설정합니다.
        switch (category) {
            case "예금":
                product.setButtonText("예금상품개설");
                product.setHref("/deposit/open");

                // 🔥 예금 특징 리스트를 복사 후 섞어서 3개만 선택
                List<String> randomDepositFeatures = new ArrayList<>(depositFeatures);
                Collections.shuffle(randomDepositFeatures);
                product.setFeatures(randomDepositFeatures.subList(0, 3));
                product.setType("D" + generateRandomNumber());
                break;

            case "적금":
                product.setButtonText("적금상품가입");
                product.setHref("/savings/open");

                // 🔥 적금 특징 리스트를 복사 후 섞어서 3개만 선택
                List<String> randomSavingsFeatures = new ArrayList<>(savingsFeatures);
                Collections.shuffle(randomSavingsFeatures);
                product.setFeatures(randomSavingsFeatures.subList(0, 3));
                product.setType("S" + generateRandomNumber());
                break;

            case "외환":
                product.setButtonText("외환상품신청");
                product.setHref("/fx/open");

                // 🔥 외환 특징 리스트를 복사 후 섞어서 3개만 선택
                List<String> randomFxFeatures = new ArrayList<>(fxFeatures);
                Collections.shuffle(randomFxFeatures);
                product.setFeatures(randomFxFeatures.subList(0, 3));
                product.setType("F" + generateRandomNumber());
                break;
        }
    }

    private int generateRandomNumber() {
        return ThreadLocalRandom.current().nextInt(10000, 100000);
    }

}
