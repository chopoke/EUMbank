package com.boot.eumbank.loan.admin.service;


import com.boot.eumbank.loan.admin.dto.LoanApproveComDTO;
import com.boot.eumbank.loan.admin.dto.LoanApproveResultDTO;
import com.boot.eumbank.loan.repository.apply.LoanApplicationHistoryRepository;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.LoanApplicationHistory;
import com.boot.eumbank.loan.service.payment.RepaymentScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 트랜잭션으로 대출 승인->금액입금 등을 원자적으로 수행하기 위한 컴포넌트
 */
@Service @RequiredArgsConstructor @Slf4j
public class LoanFundingFacade {

    private final LoanWriteService loanWrite;       // Loan_TBL 인서트
    private final AccountTxnServiceImpl accountTxn;     // 계좌 원장 생성
    private final RepaymentScheduleService schedule;  // 상환스케줄 생성
    private final LoanApplicationHistoryRepository lahRepo;     // 대출신청이력 추가

    @Transactional
    public LoanApproveResultDTO fundAndSchedule(LoanApplication app, LoanApproveComDTO cmd){

        log.info("[FUND] laId={}, status={}, payoutA={}, repayA={}",
                app.getLaId(), app.getStatus(), app.getPayoutAccountNo(), app.getRepayAccountNo());

        // 승인상태 먼저 검증
        if (!"APPROVED".equals(app.getStatus())) {
            throw new IllegalStateException("승인 상태가 아닙니다: " + app.getStatus());
        }
        
        // 상환계좌 product_code 대출로 바꾸기
        if (app.getRepayAccountNo() == null) {
            throw new IllegalArgumentException("상환계좌가 지정되지 않았습니다.");
        }
        accountTxn.markAsRepaymentAccount(app.getRepayAccountNo());

        // 2. 지급(실패시 전체 다 롤백!)
        var payoutAt = (cmd.getFirstPayoutAt() != null)
                ? cmd.getFirstPayoutAt().toLocalDateTime()
                : LocalDateTime.now();
        // 2) payDay 결정 (없으면 집행일의 day -> 1~28 클램프)
        int payDay = (cmd.getPayDay() != null)
                ? clamp(cmd.getPayDay(), 1, 28)
                : clamp(payoutAt.getDayOfMonth(), 1, 28);

        //대출원장생성
        var loan = loanWrite.createFromApplication(app, payoutAt, payDay);

        // 4) 집행 입금 (실패 시 전체 롤백)
        var amount = app.getApprovedAmount() != null ? app.getApprovedAmount() : app.getAppliedAmount();

        String transferId = ("LOANDB-" + app.getLaId() + "-" + System.currentTimeMillis());
        if (transferId.length() > 20) transferId = transferId.substring(0, 20);

        accountTxn.deposit(
                app.getPayoutAccountNo(),
                amount,
                payoutAt,
                "대출금 지급 (" + app.getLaId() + ")",
                transferId,
                "LOAN_FUNDING",   // th_transaction_type
                "DEPOSIT",        // th_transfer_type
                "EUMBANK",
                null
        );

        // 4-1) ㅅ대출 신청 이력 테이블 insert
        lahRepo.save(LoanApplicationHistory.builder()
                .loanNo(loan.getLNo())
                .disbId(transferId)
                .disbDate(payoutAt)
                .amount(amount)
                .bankCode("EUMBANK")
                .receiveAccount(String.valueOf(app.getPayoutAccountNo()))
                .memo("대출금 지급 (" + app.getLaId() + ")")
                .build()
        );


        // 5) 상환 스케줄 생성
        schedule.generate(loan);

        // 6) 신청 상태 업데이트
        app.setStatus("FUNDED");
        app.setFundedAt(payoutAt);
        app.setDecidedAt(app.getDecidedAt() != null ? app.getDecidedAt() : payoutAt); // 필요 시


        return LoanApproveResultDTO.builder()
                .laId(app.getLaId())
                .loanNo(loan.getLNo())
                .loanAccountNo(String.valueOf(loan.getANo()))
                .fundedAt(payoutAt)
                .status("FUNDED")
                .build();
    }

    // ========= 유틸 헬퍼
    private static int clamp(int v, int min, int max){
        return Math.max(min, Math.min(max, v));
    }
}
