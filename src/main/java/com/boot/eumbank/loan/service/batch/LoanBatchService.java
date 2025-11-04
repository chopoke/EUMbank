package com.boot.eumbank.loan.service.batch;

import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.repository.LoanRepository;
import com.boot.eumbank.loan.repository.payment.LoanScheduleRepository;
import com.boot.eumbank.loan.service.payment.LoanRepaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;


/**
 * 
 */
@Service @Slf4j @RequiredArgsConstructor
public class LoanBatchService {

    private final LoanScheduleRepository scheduleRepo;
    private final LoanRepository loanRepo;
    private final LoanRepaymentService repaymentService;

    // ---- 1) 당일 납부 대상 자동출금 (매일 09:05 KST)
    @Scheduled(cron = "0 5 9 * * *", zone = "Asia/Seoul")
    public void autoDebitForToday() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));       // 서울 기준
        List<LoanSchedule> dues = scheduleRepo.findAllDueForAutoDebit(today);
        log.info("Auto-debit start: {} items (due={})", dues.size(), today);

        for (LoanSchedule ls : dues) {
            try {
                Loan loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();
                BigDecimal need = ls.getDueTotal().subtract(ls.getPaidPrincipal()).subtract(ls.getPaidInterest());
                if (need.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
                        .amount(need)                         // 회차 잔액 전액
                        .paymentTime(LocalDateTime.now())     // 지금 시각
                        .installmentNo(ls.getInstallmentNo()) // 타깃 회차 지정
                        .idempotencyKey("AUTO-" + loan.getLNo() + "-" + today) // 멱등키
                        .build();
                repaymentService.repay(loan.getLNo(), req);
            } catch (Exception e) {
                log.warn("Auto-debit failed: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
            }
        }
        log.info("Auto-debit end.");
    }

    // ---- 2) 실패/부분납부 재시도 (매시간 20분)
    @Scheduled(cron = "0 20 * * * *", zone = "Asia/Seoul")
    public void retryFailedOrPartial() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        // PARTIAL/FAILED 등 정책에 맞게 조회 (예: 오늘자 + 미수금 있음)
        List<LoanSchedule> needRetry = scheduleRepo.findNeedRetry(today);
        log.info("Retry start: {} items", needRetry.size());

        for (LoanSchedule ls : needRetry) {
            try {
                Loan loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();
                BigDecimal remaining = ls.getDueTotal()
                        .subtract(ls.getPaidPrincipal()).subtract(ls.getPaidInterest());
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
                        .amount(remaining)
                        .paymentTime(LocalDateTime.now())
                        .installmentNo(ls.getInstallmentNo())
                        .idempotencyKey("RETRY-" + loan.getLNo() + "-" + today + "-" + System.currentTimeMillis())
                        .build();
                repaymentService.repay(loan.getLNo(), req);

                // (선택) 재시도 카운트/쿨다운은 스케줄 테이블에 칼럼 추가해 관리
                // ls.incRetry(); scheduleRepo.save(ls);
            } catch (Exception e) {
                log.warn("Retry failed: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
            }
        }
        log.info("Retry end.");
    }

    // ---- 3) 연체 판정 & 연체이자 업데이트 (매일 00:10)
    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void markOverdueAndAccruePenalty() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        List<LoanSchedule> overdueTargets = scheduleRepo.findOverdueTargets(today);
        log.info("Overdue accrual start: {} items (ref={})", overdueTargets.size(), today);

        for (LoanSchedule ls : overdueTargets) {
            try {
                // 예: graceDays=1 → 납기 다음날부터 OVERDUE
                // 미납 원금/이자 합에 대해 연체이율 계산(일할)
                // 내부 서비스로 분리해 적용(연체 테이블 적재, 스케줄 상태 업데이트 등)
                // penaltyService.accrue(ls, today);
                if (!"PAID".equals(ls.getStatus())) {
                    ls.setStatus("OVERDUE");
                }
                scheduleRepo.save(ls);
            } catch (Exception e) {
                log.warn("Overdue accrual failed: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
            }
        }
        log.info("Overdue accrual end.");
    }
}
