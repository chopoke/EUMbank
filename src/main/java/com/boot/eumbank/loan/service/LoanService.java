package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import org.springframework.data.domain.Page;

import java.util.Optional;

public interface LoanService {

    Page<LoanProductDTO> getProducts(String type, int page, int size);

    Optional<LoanProductDetailDTO> getProductDetail(String loanCode);
}
