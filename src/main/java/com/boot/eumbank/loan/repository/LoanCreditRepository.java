//package com.boot.eumbank.loan.repository;
//
////import com.boot.eumbank.loan.entity.LoanCreditOption;
//import com.boot.eumbank.loan.entity.LoanProduct;
//import org.springframework.data.jpa.repository.JpaRepository;
//
//import java.util.List;
//import java.util.Optional;
//
//public interface LoanCreditRepository extends JpaRepository<LoanCreditOption, Long> {
//
//    // 모든 신용옵션
//    List<LoanCreditOption> findByLoanProduct(LoanProduct product);
//
//    // A/B/C 중 하나 정확히 찾기 (엔티티 프로퍼티명: rateType)
//    Optional<LoanCreditOption> findFirstByLoanProductAndRateType(LoanProduct product, String rateType);
//
//}
