// com.boot.eumbank.foreign.repo.ForeignProductRepository.java
package com.boot.eumbank.foreign.repo;

import com.boot.eumbank.foreign.domain.ForeignProduct;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ForeignProductRepository extends JpaRepository<ForeignProduct, Integer> {

    List<ForeignProduct> findByCurUnit(String curUnit);

    @Query("""
        SELECT f FROM ForeignProduct f
        WHERE (:q IS NULL OR LOWER(f.curUnit) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(f.curNm) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:dp IS NULL OR f.dpProtectYn = :dp)
          AND (:type IS NULL OR f.prodType = :type)
    """)
    Page<ForeignProduct> search(
            @Param("q") String q,
            @Param("dp") String dpProtectYn,
            @Param("type") String prodType,
            Pageable pageable
    );
}
