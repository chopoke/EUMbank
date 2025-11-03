// com/boot/eumbank/mypage/repository/MypageSummaryRepository.java
package com.boot.eumbank.mypage.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MypageSummaryRepository {

    private final JdbcTemplate jdbc;

    /** 합계/누계 요약 */
    public Object[] sumInstallmentForCustomer(int cNo) {
        String sql = """
            SELECT
              COALESCE(SUM(i_month), 0)                               AS total_months,
              COALESCE(SUM(i_paid_installments), 0)                   AS paid_months,
              COALESCE(SUM(i_month * i_monthly_amt), 0)               AS target_amt,
              COALESCE(SUM(i_principal_paid + i_interest_accrued), 0) AS acc_amt
            FROM INSTALLMENT_TBL
            WHERE c_no = ?
              AND i_status IN ('ACTIVE','IN_PROGRESS')
            """;
        return jdbc.query(sql, ps -> ps.setInt(1, cNo), rs -> {
            if (!rs.next()) return new Object[]{0,0,0,0};
            return new Object[]{
                    rs.getInt("total_months"),
                    rs.getInt("paid_months"),
                    rs.getLong("target_amt"),
                    rs.getLong("acc_amt")
            };
        });
    }

    /** 상위 3건 */
    public List<Object[]> topInstallments(int cNo) {
        String sql = """
            SELECT 'INSTALLMENT' AS type, i_id, i_account_no,
                   (i_principal_paid + i_interest_accrued) AS amt
            FROM INSTALLMENT_TBL
            WHERE c_no = ?
              AND i_status IN ('ACTIVE','IN_PROGRESS')
            ORDER BY amt DESC
            LIMIT 3
            """;
        return jdbc.query(sql, ps -> ps.setInt(1, cNo), rs -> {
            List<Object[]> list = new ArrayList<>();
            while (rs.next()) {
                list.add(new Object[]{
                        rs.getString("type"),
                        rs.getString("i_id"),
                        rs.getString("i_account_no"),
                        rs.getLong("amt")
                });
            }
            return list;
        });
    }

    /** 납입일(일자) 목록 */
    public List<Integer> findDistinctPayDays(int cNo) {
        String sql = """
            SELECT DISTINCT i_pay_day
            FROM INSTALLMENT_TBL
            WHERE c_no = ?
              AND i_status IN ('ACTIVE','IN_PROGRESS')
            """;
        return jdbc.query(sql, ps -> ps.setInt(1, cNo),
                (rs, i) -> rs.getInt("i_pay_day"));
    }
}
