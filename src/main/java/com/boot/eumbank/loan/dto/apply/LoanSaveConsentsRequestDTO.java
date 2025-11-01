package com.boot.eumbank.loan.dto.apply;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


/**
 * 약관 저장용 DTO
 */
@Data
@NoArgsConstructor @AllArgsConstructor @Builder
public class LoanSaveConsentsRequestDTO {
    private String customerNo;          // 유저 번호
    private String productCode;         // 해당 상품 코드
    private List<LoanConsentItemDTO> items;

}
