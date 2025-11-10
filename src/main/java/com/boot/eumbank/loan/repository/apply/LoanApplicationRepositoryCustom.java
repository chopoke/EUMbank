package com.boot.eumbank.loan.repository.apply;

import com.boot.eumbank.loan.entity.LoanApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LoanApplicationRepositoryCustom {
    Page<LoanApplication> search(String laId, Integer customerNo, String status, Pageable pageable);
}
