package com.boot.eumbank.repository;

import com.boot.eumbank.entity.TransferHistory;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.sql.Timestamp;

public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Integer> {

    @Query("""
        select t from TransferHistory t
        where t.a_no = :a_no
          and (:type   is null or t.th_transfer_type = :type)
          and (:from_at is null or t.th_transfer_at >= :from_at)
          and (:to_at   is null or t.th_transfer_at <  :to_at)
        order by t.th_transfer_at desc
    """)
    Page<TransferHistory> search(
            @Param("a_no") int a_no,
            @Param("type") String type,
            @Param("from_at") Timestamp from_at,
            @Param("to_at") Timestamp to_at,
            Pageable pageable
    );
}
