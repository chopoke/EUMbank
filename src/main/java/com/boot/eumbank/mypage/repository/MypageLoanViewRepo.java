// src/main/java/com/boot/eumbank/mypage/repository/MypageLoanViewRepo.java
package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.mypage.projection.LoanRow;
import com.boot.eumbank.mypage.projection.LoanApplicationRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MypageLoanViewRepo extends JpaRepository<com.boot.eumbank.loan.entity.Loan, Long> {

    // 대출 원장(승인 완료) 목록
    @Query(value = """
        SELECT
          l.l_no            AS lNo,
          p.lpd_name        AS productName,
          l.l_principal_amount AS principalAmount,
          l.l_interest_rate AS interestRate,
          l.l_term_month    AS termMonth,
          l.l_start_date    AS startDate,
          l.l_maturity_date AS maturityDate,
          l.l_pay_day       AS payDay,
          l.l_status        AS status
        FROM LOAN_TBL l
        JOIN LOAN_PRODUCT_TBL p ON p.lpd_no = l.lpd_no
        WHERE l.c_no = :cNo
        ORDER BY COALESCE(l.l_created_at, l.l_start_date) DESC
    """, nativeQuery = true)
    List<LoanRow> findLoansByCustomer(@Param("cNo") Integer cNo);

    // 대출 신청(승인중만) – 원장에 아직 올라가지 않은 건만
    @Query(value = """
        SELECT
          a.la_no           AS laNo,
          p.lpd_name        AS productName,
          a.la_appl_amount  AS applAmount,
          a.la_appl_status  AS status,
          a.la_submitted_at AS submittedAt
        FROM LOAN_APPLICATION_TBL a
        JOIN LOAN_PRODUCT_TBL p ON p.lpd_no = a.lpd_no
        WHERE a.c_no = :cNo
          AND a.la_appl_status IN ('SUBMITTED','UNDER_REVIEW')
          AND NOT EXISTS (SELECT 1 FROM LOAN_TBL l WHERE l.la_no = a.la_no)
        ORDER BY COALESCE(a.la_submitted_at, a.la_no) DESC
    """, nativeQuery = true)
    List<LoanApplicationRow> findPendingAppsByCustomer(@Param("cNo") Integer cNo);
}
