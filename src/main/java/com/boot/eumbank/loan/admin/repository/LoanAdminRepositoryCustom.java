package com.boot.eumbank.loan.admin.repository;

import com.boot.eumbank.loan.admin.dto.LoanApplyDetailDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySearchDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySummaryDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;

import java.util.Optional;

//시그니처
public interface LoanAdminRepositoryCustom {

    // 목록 (검색/필터까지)
    Page<LoanApplySummaryDTO> search(LoanApplySearchDTO cond);

    // 신청 상세
    Optional<LoanApplyDetailDTO> getDetail(String laId);

    // 신청정보 찾ㅇ기(승인)
    Optional<LoanApplication> findEntityByLaId(String laId, LockModeType lock);
    /**
     * LockModeType : 동시성제어를 위해 사용 -> 여러 트랜잭션이 동일한 데이터를 수정하려고 할 때 충돌 방지
     * LockModeType.PESSIMISTIC_READ : 데이터를 읽을 때 다른 트랜잭션이 데이터를 수정할 수 없게 함
     * LockModeType.PESSIMISTIC_WRITE : 데이터를 수정할 떄 다른 트랜잭션이 테이터를 읽거나 수정할 수 없게함
     * LockModeType.OPTIMISTIC : 충돌이 발생했는지만 확인
     * LockModeType.READ : 읽기 전용 
     * 등등
     */
}
