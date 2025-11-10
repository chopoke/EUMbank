// src/main/java/com/boot/eumbank/mypage/repository/MyPageDepositRepository.java
package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.mypage.dto.MyDepositDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Repository
public class MyPageDepositRepository {

    @PersistenceContext
    private EntityManager em;

    /** 예금 목록: 평탄화된 MyDepositDTO 로 반환 */
    public List<MyDepositDTO> findMyDeposits(int customerNo) {
        String sql = """
            SELECT
                d.d_no                                       AS id,
                p.dp_name                                    AS productName,
                d.d_principal_bal                            AS balance,
                d.d_amount                                   AS goalAmount,
                DATE_FORMAT(d.d_join_date, '%Y-%m-%d')       AS openedAt,
                DATE_FORMAT(d.d_maturity_date, '%Y-%m-%d')   AS maturityAt,
                TIMESTAMPDIFF(MONTH, d.d_join_date, d.d_maturity_date) AS termMonths,

                -- product spec (평탄화된 dp_* 필드들)
                p.dp_name                                    AS dpName,
                p.dp_type                                    AS dpType,
                p.dp_rate                                    AS dpRate,
                p.dp_min_months                              AS dpMinMonths,
                p.dp_max_months                              AS dpMaxMonths,
                p.dp_min_amount                              AS dpMinAmount,
                p.dp_max_amount                              AS dpMaxAmount,
                p.dp_interest_payment_type                   AS dpInterestPaymentType,
                p.dp_early_termination_rate                  AS dpEarlyTerminationRate,
                p.dp_feature                                 AS dpFeature,
                p.dp_button_text                             AS dpButtonText,
                p.dp_href                                    AS dpHref
            FROM deposit_tbl d
            JOIN deposit_product_tbl p ON p.dp_no = d.dp_no
            WHERE d.c_no = :cno
            ORDER BY d.d_no DESC
            """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("cno", customerNo)
                .getResultList();

        List<MyDepositDTO> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            // 인덱스는 SELECT 순서와 1:1 매칭
            String  id          = String.valueOf(((Number) r[0]).intValue());
            String  productName = str(r[1]);
            Integer balance     = toInt(r[2]);
            Integer goalAmount  = toInt(r[3]);
            String  openedAt    = str(r[4]);  // yyyy-MM-dd
            String  maturityAt  = str(r[5]);  // yyyy-MM-dd
            Integer termMonths  = toInt(r[6]);

            // 평탄화된 dp_* 필드
            String     dpName                   = str(r[7]);
            String     dpType                   = str(r[8]);
            BigDecimal dpRate                   = toBD(r[9]);
            Integer    dpMinMonths              = toInt(r[10]);
            Integer    dpMaxMonths              = toInt(r[11]);
            BigDecimal dpMinAmount              = toBD(r[12]);
            BigDecimal dpMaxAmount              = toBD(r[13]);
            String     dpInterestPaymentType    = str(r[14]);
            BigDecimal dpEarlyTerminationRate   = toBD(r[15]);
            String     dpFeature                = str(r[16]);
            String     dpButtonText             = str(r[17]);
            String     dpHref                   = str(r[18]);

            out.add(new MyDepositDTO(
                    id, productName, balance, goalAmount,
                    openedAt, maturityAt, termMonths,
                    dpName, dpType, dpRate, dpMinMonths, dpMaxMonths,
                    dpMinAmount, dpMaxAmount, dpInterestPaymentType,
                    dpEarlyTerminationRate, dpFeature, dpButtonText, dpHref
            ));
        }
        return out;
    }

    /* ---------- 캐스팅 유틸 ---------- */
    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }
    private static Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return new BigDecimal(o.toString().trim()).intValue(); }
        catch (Exception e) { return null; }
    }
    private static BigDecimal toBD(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal b) return b;
        if (o instanceof Number n) return new BigDecimal(n.toString());
        try { return new BigDecimal(o.toString().trim()); }
        catch (Exception e) { return null; }
    }
}
