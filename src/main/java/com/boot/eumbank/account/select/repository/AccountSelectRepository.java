package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.account.open.entity.account.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface AccountSelectRepository extends JpaRepository<Account, Integer>, AccountRepositoryCustom {

    /**
     * 원화 자산 총액
     *  - a_account_type <> '외환' 인 계좌만
     *  - a_balance 합계
     */
    @Query(value = """
            SELECT COALESCE(SUM(a_balance), 0)
            FROM ACCOUNT_TBL
            WHERE a_account_type <> '외환'
            """, nativeQuery = true)
    BigDecimal sumKrwAssetsExcludingFx();

    /**
     * 외화 자산 총액 (원화 환산)
     *  - a_account_type = '외환' 인 계좌만
     *  - 각 계좌 잔액(a_balance)에 해당 통화의 매매기준율(fr_deal_bas)을 곱해서 합산
     *  - 각 통화별로 가장 최신 관측일(fr_observed_date)의 환율만 사용
     */
    @Query(value = """
            SELECT COALESCE(SUM(a.a_balance * r.fr_deal_bas), 0)
            FROM ACCOUNT_TBL a
            JOIN FOREIGN_RATE_TBL r
              ON a.a_currency = r.fr_cur_unit
            WHERE a.a_account_type = '외환'
              AND r.fr_observed_date = (
                    SELECT MAX(r2.fr_observed_date)
                    FROM FOREIGN_RATE_TBL r2
                    WHERE r2.fr_cur_unit = a.a_currency
              )
            """, nativeQuery = true)
    BigDecimal sumForeignAssetsInKrw();

    // JPQL 버전 --> Query DSL로 변경중
//    // 고객 보유 계좌 (customer.c_no 기준, 최신순)
//    @Query("""
//           select a
//           from Account a
//           where a.customer.c_no = :c_no
//           order by a.a_no desc
//           """)
//    List<Account> findAccountsByCustomer(@Param("c_no") int c_no);
//
//    // 계좌번호로 단건 조회
//    @Query("select a from Account a where a.a_account_no = :acc_no")
//    Optional<Account> findByAccountNo(@Param("acc_no") String acc_no);
//
//    // 계좌ID(비즈키)로 단건 조회
//    @Query("select a from Account a where a.a_id = :a_id")
//    Optional<Account> findByAccountId(@Param("a_id") String a_id);

}
