// src/main/java/com/boot/eumbank/risk/repo/DelinquencyEventRepo.java
package com.boot.eumbank.risk.repo;

import com.boot.eumbank.risk.entity.DelinquencyEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface DelinquencyEventRepo extends JpaRepository<DelinquencyEvent, Long> {

    //  고객별 연체 이벤트 수
    long countByCustomerNo(Integer customerNo);

    // 오늘 같은 대출(loan_no=...)에 대한 LOAN 연체 이벤트가 이미 있는지 확인
    boolean existsByCustomerNoAndCategoryAndMemoContainingAndOccurredAtBetween(
            Integer customerNo,
            String category,
            String memoKeyword,
            LocalDateTime start,
            LocalDateTime end
    );
}
