package com.boot.eumbank.loan.admin.dto;

import lombok.Data;


/**
 * 어드민 대출상품관리에 사용하는 DTO
 */
@Data
public class LoanProductSearchDTO {

    private String keyword;     // 코드/상품명 검색
    private String loanType;    // PERSONAL, JEONSE, MORTGAGE 등
    private String status;      // DRAFT, PUBLISHED, HIDDEN, ARCHIVED
    private Boolean active;     // true/false/null(전체)]
    private Integer page;       // 0-base
    private Integer size;       // 페이지 크기
}
