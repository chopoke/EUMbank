package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillAutopay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BillAutopayRepo extends JpaRepository<BillAutopay,Integer> {

    Optional<BillAutopay> findByUbNoAndBaActive(Integer ubNo, String active);

    // 동일 ub에 활성 Y가 이미 있는지
    boolean existsByUbNoAndBaActive(Integer ubNo, String active);

    List<BillAutopay> findByUbNoOrderByBaNoDesc(Integer ubNo);

    // 기간 겹침 체크: (시작<=끝 또는 끝이 null) 단순화
    @Query("""
      select count(ap) > 0 from BillAutopay ap
      where ap.ubNo = :ubNo and ap.baActive = 'Y'
        and (:start is null or ap.baEndedAt is null or ap.baEndedAt >= :start)
        and (:end   is null or ap.baStartedAt is null or ap.baStartedAt <= :end)
    """)
    boolean hasOverlap(@Param("ubNo") Integer ubNo,
                       @Param("start") LocalDateTime start,
                       @Param("end") LocalDateTime end);
}
