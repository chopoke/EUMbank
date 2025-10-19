package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import org.springframework.data.domain.Page;

public interface LoanService {

    Page<LoanProductDTO> getProducts(String type, int page, int size);

    LoanProductDetailDTO getProductDetail(String loanCode);
}
