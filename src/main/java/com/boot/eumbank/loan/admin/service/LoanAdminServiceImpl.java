package com.boot.eumbank.loan.admin.service;

import com.boot.eumbank.loan.admin.dto.*;
import com.boot.eumbank.loan.admin.repository.LoanAdminRepository;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Slf4j @RequiredArgsConstructor
public class LoanAdminServiceImpl implements LoanAdminService{

    private final LoanAdminRepository repo;
    private final LoanFundingFacade funding;

    // 목록 검색
    @Override
    @Transactional(readOnly = true)
    public Page<LoanApplySummaryDTO> findApplications(LoanApplySearchDTO cond) {
        // 기본값 보정해서
        cond.setPage(cond.getPage() == null || cond.getPage() < 0 ? 0: cond.getPage());
        cond.setSize(cond.getSize() == null || cond.getSize() < 1 ? 20 : cond.getSize());
        return repo.search(cond);
    }

    // 신청 상세
    @Override
    @Transactional(readOnly = true)
    public LoanApplyDetailDTO getDetail(String laId) {
        return repo.getDetail(laId)
                .orElseThrow(() -> new IllegalArgumentException("신청을 찾을 수 없습니다. " + laId));
    }

    // 심사시작
    @Override
    @Transactional
    public void startReview(String laId) {

        var application = repo.findEntityByLaId(laId, LockModeType.PESSIMISTIC_WRITE)
                .orElseThrow(()-> new IllegalArgumentException("신청을 찾을 수 없습니다. " + laId));

        if (!"SUBMITTED".equals(application.getStatus())) {
            throw new IllegalStateException("현재 상태(" + application.getStatus() + ")에서는 심사를 시작할 수 없습니다.");
        }

        application.setStatus("UNDER_REVIEW");
    }

    /**
     * 승인
     * @param laId /
     * @param cmd .
     * @return .
     */
    @Override
    @Transactional
    public LoanApproveResultDTO approve(String laId, LoanApproveComDTO cmd) {
        var application = repo.findEntityByLaId(laId, LockModeType.PESSIMISTIC_WRITE)
                .orElseThrow(()-> new IllegalArgumentException("신청을 찾을 수 없습니다. " + laId));

        // 심사시작 상태가 아니라면
        if (!"UNDER_REVIEW".equals(application.getStatus())) {
            throw new IllegalStateException("현재 상태에서 승인할 수 없습니다. " + application.getStatus());
        }


        application.setApprovedAmount(cmd.getApprovedAmount());     // 신청금액
        application.setApprovedTerm(cmd.getApprovedTerm());         // 신청기간
        application.setApprovedRate(cmd.getApprovedRate());         // 이율
        application.setDecidedAt(LocalDateTime.now());
        application.setStatus("APPROVED");                          // 상태 변경(승인)

        log.info("[APPROVE] laId={}, payoutA={}, repayA={}, amt={}, term={}, rate={}, firstPayoutAt={}, payDay={}",
                laId,
                application.getPayoutAccountNo(),
                application.getRepayAccountNo(),
                cmd.getApprovedAmount(), cmd.getApprovedTerm(), cmd.getApprovedRate(),
                cmd.getFirstPayoutAt(), cmd.getPayDay()
        );

        // 승인+지급 한 번에
        var result = funding.fundAndSchedule(application, cmd);
        return result;
    }

    // 반려
    @Override
    @Transactional
    public void reject(String laId, LoanRejectComDTO cmd) {
        var application = repo.findEntityByLaId(laId, LockModeType.PESSIMISTIC_WRITE)
                .orElseThrow(()-> new IllegalArgumentException("신청을 찾을 수 없습니다. " + laId));

        if ("APPROVED".equals(application.getStatus()) || "FUNDED".equals(application.getStatus())) {
            throw new IllegalStateException("승인/집행 이후엔 취소가 불가합니다.");
        }

        application.setStatus("REJECTED");      // 반료
        application.setDecisionReason(cmd.getReason());     // 반려이유
        application.setDecidedAt(LocalDateTime.now());
    }
}
