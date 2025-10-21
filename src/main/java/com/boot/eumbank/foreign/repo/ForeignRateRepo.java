package com.boot.eumbank.foreign.repo;

import com.boot.eumbank.foreign.entity.ForeignRate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ForeignRateRepo extends JpaRepository<ForeignRate, Integer> {

    Optional<ForeignRate> findByFrCurUnit(String frCurUnit);
    Optional<ForeignRate> findTopByFrCurUnitOrderByFrNoDesc(String frCurUnit);
    Optional<ForeignRate> findByFrCurUnitAndFrObservedDate(String frCurUnit, LocalDate frObservedDate);

    @Modifying @Transactional
    @Query("""
        UPDATE ForeignRate f
           SET f.frCurNm    = :name,
               f.frTtb      = :ttb,
               f.frTts      = :tts,
               f.frDealBas  = :base
         WHERE f.frCurUnit  = :unit
           AND f.frObservedDate = :obs
        """)
    int updateOne(@Param("unit") String unit,
                  @Param("name") String name,
                  @Param("ttb") BigDecimal ttb,
                  @Param("tts") BigDecimal tts,
                  @Param("base") BigDecimal base,
                  @Param("obs") LocalDate observedDate);

    @Modifying @Transactional
    @Query(value = """
        INSERT INTO FOREIGN_RATE_TBL
          (fr_cur_unit, fr_cur_nm, fr_ttb, fr_tts, fr_deal_bas, fr_observed_date)
        VALUES
          (:unit, :name, :ttb, :tts, :base, :obs)
        """, nativeQuery = true)
    int insertOne(@Param("unit") String unit,
                  @Param("name") String name,
                  @Param("ttb") BigDecimal ttb,
                  @Param("tts") BigDecimal tts,
                  @Param("base") BigDecimal base,
                  @Param("obs") LocalDate observedDate);

    default int upsertOne(String unit, String name,
                          BigDecimal ttb, BigDecimal tts, BigDecimal base,
                          LocalDate observedDate) {
        int n = updateOne(unit, name, ttb, tts, base, observedDate);
        return (n == 0) ? insertOne(unit, name, ttb, tts, base, observedDate) : n;
    }

    /** 최신 관측일의 전체 스냅샷 */
    @Query("""
        SELECT f FROM ForeignRate f
        WHERE f.frObservedDate = (SELECT max(x.frObservedDate) FROM ForeignRate x)
        ORDER BY f.frCurUnit
        """)
    List<ForeignRate> findLatestSnapshot();

    // ---- 차트용: 괄호 표기(JPY(100))까지 정상 매칭 ----
    interface RatePoint {
        LocalDate getDate();
        BigDecimal getRate();
    }

    @Query("""
        SELECT f.frObservedDate AS date,
               f.frDealBas     AS rate
          FROM ForeignRate f
         WHERE (
           CASE
             WHEN locate('(', f.frCurUnit) > 0
               THEN substring(f.frCurUnit, 1, locate('(', f.frCurUnit) - 1)
             ELSE f.frCurUnit
           END
         ) = :unit
         ORDER BY f.frObservedDate DESC
        """)
    List<RatePoint> findRecentSeriesNormalized(@Param("unit") String unit, Pageable pageable);

    // ---- Movers용: 각 통화의 최근 2개 관측일을 한 번에 가져오기 (네이티브) ----
    interface ChangeRow {
        String getUnit();      // fr_cur_unit
        LocalDate getDate();   // fr_observed_date
        BigDecimal getRate();  // fr_deal_bas
    }

    @Query(value = """
        SELECT fr_cur_unit     AS unit,
               fr_observed_date AS date,
               fr_deal_bas      AS rate
          FROM FOREIGN_RATE_TBL
         WHERE fr_observed_date IN (
                SELECT DISTINCT fr_observed_date
                  FROM FOREIGN_RATE_TBL
                 ORDER BY fr_observed_date DESC
                 LIMIT 2
               )
         ORDER BY fr_cur_unit, fr_observed_date
        """, nativeQuery = true)
    List<ChangeRow> findLast2ForAll();
}
