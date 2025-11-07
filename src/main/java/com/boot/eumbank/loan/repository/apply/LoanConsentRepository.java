package com.boot.eumbank.loan.repository.apply;

import com.boot.eumbank.loan.entity.LoanConsent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 대출 약관 동의 저장
 */
public interface LoanConsentRepository extends JpaRepository<LoanConsent, Long> {

    /**
     * 고객 + 약관코드 별 최신동의
     * @param customerNo 고객번호
     * @param termCode
     * @return
     */
    List<LoanConsent> findByCustomerNoAndTermCodeOrderByAgreedAtDesc(Integer customerNo, String termCode);

    /**
     * 특정 신청에 귀속 laNo
     * @param laNo 신청번호
     * @return .
     */
    List<LoanConsent> findByLaNo(Long laNo);

    /**
     * 신청후 null이었던 laNo에 신청번호 붙이기(신청번호 갱신)
     * @param customerNo 고객번호
     * @param laNo 신청번호
     * @return .
     */
    @Modifying
    @Query("""
        update LoanConsent c
           set c.laNo = :laNo
         where c.laNo is null
           and c.customerNo = :customerNo
    """)
    int attachLaNoToConsents(@Param("customerNo") Integer customerNo,
                             @Param("laNo") Long laNo);

}
