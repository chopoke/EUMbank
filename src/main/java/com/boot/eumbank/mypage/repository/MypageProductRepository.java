package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface MypageProductRepository extends JpaRepository<Customer, Integer> {
    // └─ 아무 엔티티나 하나 지정해야 Spring Data 프록시가 생성됩니다.
    //     (여기선 Customer를 사용합니다. 기본 CRUD는 쓰지 않아도 무방)

    // 로그인 userId → c_no
    @Query("select c.customerNo from Customer c where c.userId = :userId")
    Integer findCustomerNoByUserId(@Param("userId") String userId);

    /* ===== 적금 =====
       반환 키는 서비스 DTO 매퍼가 꺼내는 이름과 동일해야 합니다.
       id, productName, totalInstallments, paidInstallments, monthlyAmount, nextDueDate
    */
    @Query(value = """
        SELECT 
          i.i_id                         AS id,
          ip.ip_name                     AS productName,
          i.i_month                      AS totalInstallments,
          i.i_paid_installments          AS paidInstallments,
          i.i_monthly_amt                AS monthlyAmount,
          DATE_FORMAT(
            DATE_ADD(i.i_join_date, INTERVAL (i.i_paid_installments + 1) MONTH),
            '%Y-%m-%d'
          )                              AS nextDueDate
        FROM INSTALLMENT_TBL i
        JOIN INSTALLMENT_PRODUCT_TBL ip ON ip.ip_no = i.ip_no
        WHERE i.c_no = :cNo
        ORDER BY i.i_join_date DESC
        """, nativeQuery = true)
    List<Map<String,Object>> findMySavings(@Param("cNo") Integer cNo);

    /* ===== 예금 =====
       id, productName, balance, goalAmount, openedAt, maturityAt
    */
    @Query(value = """
        SELECT
          d.d_id                         AS id,
          dp.dp_name                     AS productName,
          d.d_principal_bal              AS balance,
          NULL                           AS goalAmount,
          DATE_FORMAT(d.d_join_date, '%Y-%m-%d')     AS openedAt,
          DATE_FORMAT(d.d_maturity_date, '%Y-%m-%d') AS maturityAt
        FROM DEPOSIT_TBL d
        JOIN DEPOSIT_PRODUCT_TBL dp ON dp.dp_no = d.dp_no
        WHERE d.c_no = :cNo
        ORDER BY d.d_join_date DESC
        """, nativeQuery = true)
    List<Map<String,Object>> findMyDeposits(@Param("cNo") Integer cNo);

    /* ===== 대출 =====
       id, productName, balance, rate, openedAt, maturityAt
    */
    @Query(value = """
        SELECT
          l.l_id                          AS id,
          lp.lpd_name                     AS productName,
          l.l_principal_amount            AS balance,
          l.l_interest_rate               AS rate,
          DATE_FORMAT(l.start_date, '%Y-%m-%d')      AS openedAt,
          DATE_FORMAT(l.l_maturity_date, '%Y-%m-%d') AS maturityAt
        FROM LOAN_TBL l
        JOIN LOAN_PRODUCT_TBL lp ON lp.lpd_no = l.lpd_no
        WHERE l.c_no = :cNo
        ORDER BY l.start_date DESC
        """, nativeQuery = true)
    List<Map<String,Object>> findMyLoans(@Param("cNo") Integer cNo);
}
