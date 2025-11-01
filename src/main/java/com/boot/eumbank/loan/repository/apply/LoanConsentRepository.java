package com.boot.eumbank.loan.repository.apply;

import com.boot.eumbank.loan.entity.LoanConsent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 대출 약관 동의 저장
 * -> 추후 pdf로 제공하기 위함.
 */
public interface LoanConsentRepository extends JpaRepository<LoanConsent, Long> {
    List<LoanConsent> findByCustomerNoAndTermCodeOrderByAgreedAtDesc(Integer customerNo, String termCode);
    List<LoanConsent> findByLaNo(Long laNo);
}
