package com.boot.eumbank.loan.repository.payment;

import com.boot.eumbank.loan.entity.LoanSchedule;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 스케쥴 레포(커스텀 상속)
 */
public interface LoanScheduleRepository extends JpaRepository<LoanSchedule, Long>, LoanScheduleRepositoryCustom {

    List<LoanSchedule> findByLoanNoOrderByInstallmentNoAsc(Long loanNo);
    // 미납(= 납기총액 > 기납부원리금)인 스케줄 중 가장 빠른 납기일
    @Query("""
        select min(ls.dueDate)
        from LoanSchedule ls
        where (coalesce(ls.paidPrincipal,0) + coalesce(ls.paidInterest,0)) < coalesce(ls.dueTotal,0)
    """)
    Optional<LocalDate> findEarliestUnpaidDueDate();

}
