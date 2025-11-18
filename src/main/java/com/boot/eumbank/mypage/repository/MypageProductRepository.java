// src/main/java/com/boot/eumbank/mypage/repository/MypageProductRepository.java
package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.product.entity.product.ProductDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface MypageProductRepository extends JpaRepository<ProductDeposit, Integer> {

    @Query(value = """
        SELECT c.c_no
        FROM CUSTOMER_TBL c
        WHERE c.c_user_id = :userId
        LIMIT 1
    """, nativeQuery = true)
    Integer findCustomerNoByUserId(@Param("userId") String userId);

    /* --------------------------- 예금 --------------------------- */
    @Query(value = """
        SELECT 
           d.d_id                                         AS id,
           dp.dp_name                                     AS productName,
           IFNULL(d.d_principal_bal, 0)                   AS dPrincipalBal,
           IFNULL(d.d_amount, 0)                          AS dAmount,
           DATE_FORMAT(d.d_join_date, '%Y-%m-%d')         AS openedAt,
           DATE_FORMAT(d.d_maturity_date, '%Y-%m-%d')     AS maturityAt,
           TIMESTAMPDIFF(MONTH, d.d_join_date, d.d_maturity_date) AS termMonths,

           dp.dp_type                          AS dpType,
           dp.dp_rate                          AS dpRate,
           dp.dp_min_amount                    AS dpMinAmount,
           dp.dp_max_amount                    AS dpMaxAmount,
           dp.dp_min_months                    AS dpMinMonths,
           dp.dp_max_months                    AS dpMaxMonths,
           dp.dp_interest_payment_type         AS dpInterestPaymentType,
           dp.dp_early_termination_rate        AS dpEarlyTerminationRate,
           dp.dp_feature                       AS dpFeature,
           dp.dp_button_text                   AS dpButtonText,
           dp.dp_href                          AS dpHref
        FROM DEPOSIT_TBL d
        JOIN DEPOSIT_PRODUCT_TBL dp ON dp.dp_no = d.dp_no
        WHERE d.c_no = :cNo
        ORDER BY d.d_join_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMyDeposits(@Param("cNo") Integer cNo);

    /* --------------------------- 적금 --------------------------- */
    @Query(value = """
        SELECT
           i.i_id                                        AS id,
           ip.ip_name                                    AS productName,

           -- 회차 / 금액
           i.i_month                                     AS totalInstallments,
           i.i_count_period                              AS paidInstallments,      -- ★ 진행 회차 = i_count_period
           i.i_principal_bal                             AS iPrincipalBal,        -- ★ 현재 원금 잔액
           i.i_expected_maturity_amount                  AS expectedMaturityAmount,
           i.i_interest_rate                             AS iInterestRate,
           i.i_paid_installments                         AS iPaidInstallments,    -- 레거시 값 (옵션, fallback 용)

           ROUND(COALESCE(i.i_expected_maturity_amount, 0) / NULLIF(i.i_month, 0)) AS monthlyAmount,

           a.a_no                                        AS aNo,
           i.i_account_no                                AS accountNo,

           -- 다음 납입일: 가입일 + (인정 회차 + 1)개월
           DATE_FORMAT(
             DATE_ADD(
               DATE(i.i_join_date),
               INTERVAL (COALESCE(i.i_count_period, i.i_paid_installments) + 1) MONTH
             ),
             '%Y-%m-%d'
           )                                             AS nextDueDate,

           -- 상품 정보
           ip.ip_type                                    AS ipType,
           ip.ip_min_months                              AS ipMinMonths,
           ip.ip_max_months                              AS ipMaxMonths,
           ip.ip_min_monthly_amount                      AS ipMinMonthlyAmount,
           ip.ip_max_monthly_amount                      AS ipMaxMonthlyAmount,
           ip.ip_early_termination_rate                  AS ipEarlyTerminationRate,
           ip.ip_interest_payment_type                   AS ipInterestPaymentType,
           ip.ip_rate                                    AS ipRate,
           COALESCE(ip.ip_feature, ip.ip_featue)         AS ipFeature,
           ip.ip_button_text                             AS ipButtonText,
           ip.ip_href                                    AS ipHref
        FROM INSTALLMENT_TBL i
        JOIN INSTALLMENT_PRODUCT_TBL ip ON ip.ip_no = i.ip_no
        JOIN ACCOUNT_TBL a               ON a.a_no = i.a_no
        WHERE i.c_no = :cNo
        ORDER BY i.i_join_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMySavings(@Param("cNo") Integer cNo);

    /* --------------------------- 대출 (모달 필드 포함) --------------------------- */
    @Query(value = """
        SELECT
           l.l_id                                         AS id,
           lp.lpd_name                                    AS productName,

           l.l_principal_amount                           AS principal,
           l.l_balance                                    AS balance,
           l.l_interest_rate                              AS rate,

           l.l_term_month                                 AS termMonths,
           DATE_FORMAT(l.l_start_date,     '%Y-%m-%d')    AS openedAt,
           DATE_FORMAT(l.l_maturity_date, '%Y-%m-%d')     AS maturityAt,

           /* 모달 표시용 (카멜 alias 고정) */
           lp.lpd_type            AS loanType,
           l.l_repay_method       AS repayMethod,
           l.l_rate_type          AS rateType,
           lp.lpd_bank_name       AS lender
        FROM LOAN_TBL l
        JOIN LOAN_PRODUCT_TBL lp ON lp.lpd_no = l.lpd_no
        WHERE l.c_no = :cNo
        ORDER BY l.l_start_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMyLoans(@Param("cNo") Integer cNo);
}
