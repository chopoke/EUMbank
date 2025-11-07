// src/main/java/com/boot/eumbank/mypage/repository/MyPageDepositRepository.java
package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.mypage.dto.MyDepositDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
@Transactional(readOnly = true)
public class MyPageDepositRepository {

    @PersistenceContext
    private EntityManager em;

    public List<MyDepositDTO> findMyDeposits(int customerNo) {
        String sql = """
            SELECT
              d.d_no                                              AS id,
              p.dp_name                                           AS productName,
              d.d_principal_bal                                   AS balance,
              DATE(d.d_join_date)                                 AS openDate,
              DATE(d.d_maturity_date)                             AS maturityAt,
              GREATEST(
                1,
                TIMESTAMPDIFF(MONTH, DATE(d.d_join_date), DATE(d.d_maturity_date))
                + IF(DAY(d.d_maturity_date) >= DAY(d.d_join_date), 1, 0)
              )                                                   AS termMonths
            FROM DEPOSIT_TBL d
            JOIN DEPOSIT_PRODUCT_TBL p ON p.dp_no = d.dp_no
            WHERE d.c_no = :cno
            ORDER BY d.d_join_date DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("cno", customerNo)
                .getResultList();

        List<MyDepositDTO> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            Integer id          = ((Number) r[0]).intValue();
            String  name        = (String) r[1];
            Long    bal         = r[2] == null ? 0L : ((Number) r[2]).longValue();
            LocalDate openDate  = r[3] == null ? null : ((Date) r[3]).toLocalDate();
            LocalDate maturity  = r[4] == null ? null : ((Date) r[4]).toLocalDate();
            Integer termMonths  = r[5] == null ? null : ((Number) r[5]).intValue();

            out.add(new MyDepositDTO(id, name, bal, openDate, maturity, termMonths));
        }
        return out;
    }
}
