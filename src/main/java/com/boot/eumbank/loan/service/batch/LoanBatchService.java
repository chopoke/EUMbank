package com.boot.eumbank.loan.service.batch;

import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.repository.LoanRepository;
import com.boot.eumbank.loan.repository.payment.LoanScheduleRepository;
import com.boot.eumbank.loan.service.delinquency.LoanDelinquencyService;
import com.boot.eumbank.loan.service.payment.LoanRepaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoanBatchService {

    private final LoanScheduleRepository scheduleRepo;
    private final LoanRepository loanRepo;
    private final LoanRepaymentService repaymentService;
    private final LoanDelinquencyService delinquencyService;

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    /**
     * 1) 당일 및 기한 경과분 자동 출금
     * - 상환계좌(repayAccount)가 지정된 대출만 대상
     */
    //@Scheduled(cron = "0 0/5 * * * *", zone = "Asia/Seoul") // 5분마다
    @Scheduled(cron = "0/10 * * * * *", zone = "Asia/Seoul")
    public void autoDebitForToday() {
        LocalDate today = LocalDate.now(ZONE);

        // due_date <= today && status in (DUE, PARTIAL, FAILED, OVERDUE) && 잔액>0
        List<LoanSchedule> dues = scheduleRepo.findAllDueForAutoDebit(today);

        dues.sort(Comparator
                .comparing(LoanSchedule::getDueDate)
                .thenComparing(LoanSchedule::getInstallmentNo));

        log.info("@@@@@@@@@@ 자동 상환 시작: {} items (asOf={})", dues.size(), today);

        for (LoanSchedule ls : dues) {
            Loan loan = loanRepo.findById(ls.getLoanNo()).orElse(null);
            if (loan == null) {
                log.warn("@@@@@@@@@@ autoDebit skip: loan not found. lsNo={}", ls.getLsNo());
                continue;
            }

            // 상환계좌 없는(또는 0 이하) 대출은 자동이체 대상 아님
            if (loan.getRepayAccount() <= 0) {
                continue;
            }
            // if (!"Y".equalsIgnoreCase(loan.getAutoDebitYn())) continue;

            BigDecimal remaining = ls.getDueTotal()
                    .subtract(nvl(ls.getPaidPrincipal()))
                    .subtract(nvl(ls.getPaidInterest()));

            if (remaining.compareTo(ZERO) <= 0) {
                continue;
            }

            try {
                LocalDateTime payTime = LocalDateTime.now(ZONE);
                String idem = "AUTO-" + loan.getLNo()
                        + "-" + ls.getInstallmentNo()
                        + "-" + today;

                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
                        .amount(remaining)
                        .paymentTime(payTime)
                        .installmentNo(ls.getInstallmentNo())
                        .idempotencyKey(idem)
                        .build();

                repaymentService.repay(loan.getLNo(), req);

                log.info("@@@@@@@@@@ 자동상환 성공: loanNo={}, lsNo={}, amount={}",
                        loan.getLNo(), ls.getLsNo(), remaining);

            } catch (Exception e) {
                handleAutoDebitFailure(today, ls, loan, remaining, e);
            }
        }

        log.info("@@@@@@@@@@ 자동 상환 종료 (asOf={})", today);
    }

    /**
     * 2) 실패/부분납부 재시도
     * - 여전히 잔액 남아있고 (findNeedRetry 조건)
     * - 상환계좌 있는 대출만
     * - 연체 상태(OVERDUE) 포함해서 계속 재시도
     */
    //@Scheduled(cron = "0 2/15 * * * *", zone = "Asia/Seoul") // 매 15분, 2분부터
    @Scheduled(cron = "3/10 * * * * *", zone = "Asia/Seoul")
    public void retryFailedOrPartial() {
        LocalDate today = LocalDate.now(ZONE);
        List<LoanSchedule> targets = scheduleRepo.findNeedRetry(today);

        targets.sort(Comparator
                .comparing(LoanSchedule::getDueDate)
                .thenComparing(LoanSchedule::getInstallmentNo));

        log.info("@@@@@@@@@@ 상환 재시도 시작: {} items (asOf={})", targets.size(), today);

        for (LoanSchedule ls : targets) {
            Loan loan = loanRepo.findById(ls.getLoanNo()).orElse(null);
            if (loan == null) {
                log.warn("@@@@@@@@@@ retry skip: loan not found. lsNo={}", ls.getLsNo());
                continue;
            }

            // 자동이체용 상환계좌 없으면 스킵
            if (loan.getRepayAccount() <= 0) { // <-- 괄호 수정
                continue;
            }
            // if (!"Y".equalsIgnoreCase(loan.getAutoDebitYn())) continue;

            BigDecimal remaining = ls.getDueTotal()
                    .subtract(nvl(ls.getPaidPrincipal()))
                    .subtract(nvl(ls.getPaidInterest()));
            if (remaining.compareTo(ZERO) <= 0) continue;

            try {
                LocalDateTime payTime = LocalDateTime.now(ZONE);
                String idem = "RETRY-" + loan.getLNo()
                        + "-" + ls.getInstallmentNo()
                        + "-" + payTime.toLocalTime();

                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
                        .amount(remaining)
                        .paymentTime(payTime)
                        .installmentNo(ls.getInstallmentNo())
                        .idempotencyKey(idem)
                        .build();

                repaymentService.repay(loan.getLNo(), req);

                log.info("@@@@@@@@@@ 상환 재시도 성공: loanNo={}, lsNo={}, amount={}",
                        loan.getLNo(), ls.getLsNo(), remaining);

            } catch (Exception e) {
                handleAutoDebitFailure(today, ls, loan, remaining, e);
            }
        }

        log.info("@@@@@@@@@@ 상환 재시도 종료 (asOf={})", today);
    }

    /**
     * 3) 연체 판정 & 연체 스케줄 상태 업데이트
     * - due_date < today
     * - 잔액 남았으면 OVERDUE 로
     * - 간단히 upsertDailySnapshot 사용
     */
    //@Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul") // 매일 00:10
    @Scheduled(cron = "6/10 * * * * *", zone = "Asia/Seoul")
    public void markOverdueAndAccruePenalty() {
        LocalDate today = LocalDate.now(ZONE);
        List<LoanSchedule> overdueTargets = scheduleRepo.findOverdueTargets(today);

        log.info("@@@@@@@@@@ 연체계산시작: {} items (ref={})", overdueTargets.size(), today);

        for (LoanSchedule ls : overdueTargets) {
            try {
                // 아직 완납이 아니면 OVERDUE 표시
                if (!"PAID".equals(ls.getStatus())) {
                    ls.setStatus("OVERDUE");
                    scheduleRepo.save(ls);
                }

                // 남은 금액 기준으로 일일 연체이자 스냅샷 적재 (간단 버전)
                BigDecimal remaining = ls.getDueTotal()
                        .subtract(nvl(ls.getPaidPrincipal()))
                        .subtract(nvl(ls.getPaidInterest()));

                if (remaining.compareTo(ZERO) > 0) {
                    BigDecimal penMarginPct = new BigDecimal("2.0");
                    BigDecimal capPct       = new BigDecimal("20.0");
                    BigDecimal baseRatePct  = new BigDecimal("10.0");
                    BigDecimal appliedPct   = baseRatePct.add(penMarginPct).min(capPct);

                    BigDecimal todayDel = remaining
                            .multiply(appliedPct)
                            .divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                            .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);

                    delinquencyService.upsertDailySnapshot(
                            ls.getLoanNo(),
                            ls.getLsNo(),
                            today,
                            penMarginPct,
                            capPct,
                            appliedPct,
                            remaining,
                            todayDel.max(ZERO),
                            "N",
                            "overdue"
                    );
                }

            } catch (Exception e) {
                log.warn("@@@@@@@@@@ 연체 계산 실패: lsNo={}, cause={}", ls.getLsNo(), e.getMessage(), e);
            }
        }

        log.info("@@@@@@@@@@ 연체 계산 종료.");
    }

    // ================== 내부 유틸 ==================

    private void handleAutoDebitFailure(LocalDate today,
                                        LoanSchedule ls,
                                        Loan loan,
                                        BigDecimal overdueAmt,
                                        Exception e) {

        boolean insufficient = isInsufficientBalance(e)
                || (e.getMessage() != null && e.getMessage().contains("잔액 부족"));

        if (!insufficient) {
            log.warn("@@@@@@@@@@ 자동상환 실패(기타): loanNo={}, lsNo={}, cause={}",
                    loan.getLNo(), ls.getLsNo(), e.getMessage(), e);
            return;
        }

        BigDecimal safeOverdue = overdueAmt.max(ZERO);

        BigDecimal penMarginPct = new BigDecimal("2.0");
        BigDecimal capPct       = new BigDecimal("20.0");
        BigDecimal baseRatePct  = new BigDecimal("10.0");
        BigDecimal appliedPct   = baseRatePct.add(penMarginPct).min(capPct);

        BigDecimal todayDel = safeOverdue
                .multiply(appliedPct)
                .divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);

        log.warn("@@@@@@@@@@ DELINQ 적재: loanNo={}, lsNo={}, overdue={}, todayDel={}",
                loan.getLNo(), ls.getLsNo(), safeOverdue, todayDel);

        delinquencyService.upsertDailySnapshot(
                loan.getLNo(),
                ls.getLsNo(),
                today,
                penMarginPct,
                capPct,
                appliedPct,
                safeOverdue,
                todayDel.max(ZERO),
                "N",
                "auto-debit failed"
        );

        log.warn("@@@@@@@@@@ 잔액부족 - 자동상환 실패 : loanNo={}, lsNo={}, cause={}",
                loan.getLNo(), ls.getLsNo(), e.getMessage());
    }

    private boolean isInsufficientBalance(Throwable e) {
        while (e != null) {
            if (e instanceof com.boot.eumbank.transfer_domain.transfer.exception.InsufficientBalanceException)
                return true;
            if ("InsufficientBalanceException".equals(e.getClass().getSimpleName()))
                return true;
            e = e.getCause();
        }
        return false;
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? ZERO : v;
    }
}
