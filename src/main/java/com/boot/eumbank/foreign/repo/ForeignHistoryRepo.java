// src/main/java/com/boot/eumbank/foreign/repo/ForeignHistoryRepo.java
package com.boot.eumbank.foreign.repo;

import com.boot.eumbank.foreign.entity.ForeignHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForeignHistoryRepo extends JpaRepository<ForeignHistory, Integer> {

    // 단일 글자 시작 필드(cNo) 때문에 파생 메서드가 깨져서 @Query로 명시
    @Query("select f from ForeignHistory f where f.cNo = :cNo order by f.fhOrderedAt desc")
    List<ForeignHistory> findByCNoOrderByFhOrderedAtDesc(@Param("cNo") Integer cNo);

    Optional<ForeignHistory> findByFhExId(String fhExId);
}
