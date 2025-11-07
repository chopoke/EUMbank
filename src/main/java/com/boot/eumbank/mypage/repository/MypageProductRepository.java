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
           IFNULL(d.d_principal_bal, 0)                   AS balance,
           IFNULL(d.d_amount, 0)                          AS goalAmount,
           DATE_FORMAT(d.d_join_date, '%Y-%m-%d')         AS openedAt,
           DATE_FORMAT(d.d_maturity_date, '%Y-%m-%d')     AS maturityAt,
           TIMESTAMPDIFF(MONTH, d.d_join_date, IFNULL(d.d_maturity_date, NOW())) AS termMonths,
           TIMESTAMPDIFF(MONTH, d.d_join_date, LEAST(NOW(), IFNULL(d.d_maturity_date, NOW()))) AS elapsedMonths
        FROM DEPOSIT_TBL d
        JOIN DEPOSIT_PRODUCT_TBL dp ON dp.dp_no = d.dp_no
        WHERE d.c_no = :cNo
        ORDER BY d.d_join_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMyDeposits(@Param("cNo") Integer cNo);

    /* --------------------------- 적금 (a_no + paidInstallments 계산) --------------------------- */
    @Query(value = """
        SELECT
           i.i_id                                           AS id,
           ip.ip_name                                       AS productName,
           CAST(IFNULL(i.i_month, 0) AS SIGNED)             AS totalInstallments,
           /* TRANSFER_HISTORY_TBL에서 SAVING_PAY 건수로 납입회차 계산 */
           CAST((
              SELECT COUNT(*)
              FROM TRANSFER_HISTORY_TBL th
              WHERE th.a_no = i.a_no
                AND th.th_transaction_type = 'SAVING_PAY'
           ) AS SIGNED)                                     AS paidInstallments,
           CAST(IFNULL(i.i_monthly_amt, 0) AS SIGNED)       AS monthlyAmount,
           a.a_no                                           AS a_no,
           i.i_account_no                                   AS accountNo,
           DATE_FORMAT(
             DATE_ADD(DATE(i.i_join_date), INTERVAL (
               /* 다음 납입 예정일: 이미 납입한 회차 + 1 */
               (SELECT COUNT(*) FROM TRANSFER_HISTORY_TBL th2
                 WHERE th2.a_no = i.a_no AND th2.th_transaction_type = 'SAVING_PAY') + 1
             ) MONTH),
             '%Y-%m-%d'
           )                                                AS nextDueDate
        FROM INSTALLMENT_TBL i
        JOIN INSTALLMENT_PRODUCT_TBL ip ON ip.ip_no = i.ip_no
        JOIN ACCOUNT_TBL a               ON a.a_no = i.a_no
        WHERE i.c_no = :cNo
        ORDER BY i.i_join_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMySavings(@Param("cNo") Integer cNo);

    /* --------------------------- 대출 --------------------------- */
    @Query(value = """
        SELECT
           l.l_id                                         AS id,
           lp.lpd_name                                    AS productName,
           l.l_principal_amount                           AS balance,
           l.l_interest_rate                              AS rate,
           DATE_FORMAT(l.start_date,      '%Y-%m-%d')     AS openedAt,
           DATE_FORMAT(l.l_maturity_date, '%Y-%m-%d')     AS maturityAt
        FROM LOAN_TBL l
        JOIN LOAN_PRODUCT_TBL lp ON lp.lpd_no = l.lpd_no
        WHERE l.c_no = :cNo
        ORDER BY l.start_date DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMyLoans(@Param("cNo") Integer cNo);
}
