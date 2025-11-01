package com.boot.eumbank.product.dto.product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 예금 가입 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositSubscriptionRequestDto {

    /**
     * 상품 NO
     */
    private String dpNo;

    /**
     * 상품명
     */
    private String productName;

    /**
     * 예치 금액
     */
    private Long amount;

    /**
     * 가입 기간 (개월)
     */
    private Integer period;

    /**
     * 출금 계좌 번호
     */
    private String linkedAccount;

    /**
     * 입금 계좌 번호 (신규 생성될 예금 계좌)
     */
    private String depositAccount;

    /**
     * 계좌 비밀번호
     */
    private String pin;

    /**
     * 서명 날짜
     */
    private String signatureDate;

    /**
     * 원본 PDF 경로 (예: /deposit/sample.pdf)
     */
    private String templatePdfPath;

    /**
     * 약관 동의
     */
    private String agreements;


}