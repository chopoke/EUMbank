package com.boot.eumbank.loan.repository;


import com.boot.eumbank.loan.entity.LoanProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanProductRepository extends JpaRepository<LoanProduct, Long> {

    Optional<LoanProduct> findByLoanCode(String loanCode);
    // 활성화 기준
    Page<LoanProduct> findByLoanTypeAndIsActiveTrue(String loanType, Pageable pageable);        // isActive-> Y일때
    // status도 같이 필터링 하기
    Page<LoanProduct> findByLoanTypeAndStatusAndIsActiveTrue(String loanType, String status, Pageable pageable);
}
