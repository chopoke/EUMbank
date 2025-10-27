package com.boot.eumbank.product.dto.product;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 프론트엔드로 전달될 통합 상품 DTO (Data Transfer Object)
 * 각기 다른 상품 테이블의 데이터를 이 공통 형식으로 변환합니다.
 */
@Data
@NoArgsConstructor
public class ProductDto {
    private String id;          // 상품 고유 ID (예: "deposit-1", "savings-1")
    private String name;        // 상품명 (예: "고수익 예금")
    private String description;
    private String rate;        // 대표 이자율 또는 수수료 (예: "연 2.5%", "송금 수수료 5,000원")
    private String maxAmount;   // 최대 금액 (예: "최대 금액: 10000000000....원)
    private String minAmount;   // 최소 금액 (예: "최소 금액: 0원")
    private Integer maxMonths;   // 최대 개월수
    private Integer minMonths;   // 최소 개월수
    private String paymentType; // 지불방식
    private List<String> features; // 상품 특징 리스트
    private String buttonText;  // 버튼 텍스트 (예: "계좌 개설")
    private String href;        // 상세 페이지 경로
    private String type;        // 상품 타입 코드 (예: "D12345")
    private String category;    // 상품 카테고리 (예: "예금", "적금", "외환")
    private String feature;

    // QueryDSL Projections.constructor 를 사용하기 위한 생성자
    public ProductDto(String id, String name, String type, String description, String rate,
                      String maxAmount, String minAmount, Integer minMonths, Integer maxMonths, String paymentType, String feature, String href, String buttonText, String category) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.rate = rate;
        this.maxAmount = maxAmount;
        this.minAmount = minAmount;
        this.minMonths = minMonths;
        this.maxMonths = maxMonths;
        this.paymentType = paymentType;
        this.feature = feature;
        this.href = href;
        this.buttonText = buttonText;
        this.category = category;
        // 나머지 필드들은 서비스 레이어에서 비즈니스 로직에 따라 채워줍니다.
    }
}