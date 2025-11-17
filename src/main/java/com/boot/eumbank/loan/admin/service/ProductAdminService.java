package com.boot.eumbank.loan.admin.service;

import com.boot.eumbank.loan.admin.dto.LoanProductSearchDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;

public interface ProductAdminService {

    // 목록 조회 (검색 + 정렬 + 페이징)
    Page<LoanProduct> searchProducts(LoanProductSearchDTO dto);

    // 신규 등록 폼용 기본값 세팅된 엔티티
    LoanProduct prepareNewProduct();

    // 수정 폼용 상품 조회
    LoanProduct getProductOrThrow(Long id);

    // 수정 폼에서 기존 옵션 리스트 노출용
    List<LoanRateOption> getRateOptions(Long productId);

    // 상품 생성 + 옵션 생성
    LoanProduct createProduct(LoanProduct product,
                              List<String> optRpayTypeNmList,
                              List<String> optLendRateTypeNmList,
                              List<BigDecimal> optLendRateMinList,
                              List<BigDecimal> optLendRateMaxList,
                              List<String> optNoteList);

    // 상품 수정 + 옵션 재저장
    LoanProduct updateProduct(Long id,
                              LoanProduct form,
                              List<String> optRpayTypeNmList,
                              List<String> optLendRateTypeNmList,
                              List<BigDecimal> optLendRateMinList,
                              List<BigDecimal> optLendRateMaxList,
                              List<String> optNoteList);

    // 삭제
    void deleteProduct(Long id);
}
