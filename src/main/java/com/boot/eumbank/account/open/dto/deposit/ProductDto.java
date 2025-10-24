package com.boot.eumbank.account.open.dto.deposit;

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
    private String rate;        // 대표 이자율 또는 수수료 (예: "연 2.5%", "송금 수수료 5,000원")
    private String minAmount;   // 최소 금액 (예: "최소 금액: 0원")
    private List<String> features; // 상품 특징 리스트
    private String buttonText;  // 버튼 텍스트 (예: "계좌 개설")
    private String href;        // 상세 페이지 경로
    private String type;        // 상품 타입 코드 (예: "D12345")
    private String category;    // 상품 카테고리 (예: "예금", "적금", "외환")

    // QueryDSL Projections.constructor 를 사용하기 위한 생성자
    public ProductDto(String id, String name, String rate, String minAmount, String category) {
        this.id = id;
        this.name = name;
        this.rate = rate;
        this.minAmount = minAmount;
        this.category = category;
        // 나머지 필드들은 서비스 레이어에서 비즈니스 로직에 따라 채워줍니다.
    }
}