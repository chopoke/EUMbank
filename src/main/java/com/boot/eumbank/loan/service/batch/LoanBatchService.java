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

import javax.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;


/**
 *  상환 일정 
 */
@Service @Slf4j @RequiredArgsConstructor
public class LoanBatchService {

    private final LoanScheduleRepository scheduleRepo;
    private final LoanRepository loanRepo;
    private final LoanRepaymentService repaymentService;
    private final LoanDelinquencyService delinquencyService;

    // 시간제어
    private static LocalDate SIM_START = null;   // 최초 기준일(가장 이른 미납 납기일)
    private static int SIM_OFFSET_MONTHS = 0;    // 10초마다 +1개월

    // 애플리케이션 시작 직후 한 번 초기화(가장 빠른 미납 납기일로 세팅)
    @PostConstruct
    void initSimStart() {
        SIM_START = scheduleRepo.findEarliestUnpaidDueDate()
                .orElse(LocalDate.now(ZoneId.of("Asia/Seoul")));
        // 말일 보정 필요 시 여기서 조정 가능
        log.info("[SIM] start set to {}", SIM_START);
    }
    private static LocalDate simToday() {
        if (SIM_START == null) {
            SIM_START = LocalDate.now(ZoneId.of("Asia/Seoul"));
        }
        // 월 전진 시 말일 이슈 보정: 대상 월의 마지막 일자를 넘지 않게 clamp
        LocalDate base = SIM_START.plusMonths(SIM_OFFSET_MONTHS);
        int last = base.lengthOfMonth();
        int d = Math.min(SIM_START.getDayOfMonth(), last);
        return base.withDayOfMonth(d);
    }


    // ---- 1) 당일 납부 대상 자동출금
    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul")        // 50초마다 한달  -> 5분마다 한달
    //@Scheduled(cron = "0 5 9 * * *", zone = "Asia/Seoul")
    public void autoDebitForToday() {
        // LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));       // 서울 기준
        // List<LoanSchedule> dues = scheduleRepo.findAllDueForAutoDebit(today);
        var today = simToday();       // 임의로 설정한 today값 할당
        var dues = scheduleRepo.findAllDueForAutoDebit(today);
        log.info(" @@@@@@@@@@   자동 상환 시작: {} items (due={})", dues.size(), today);

        dues = dues.stream().limit(1).toList();     // 한배치당 한건만
        
        for (var ls : dues) {
            try {
                var loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();
                var need = ls.getDueTotal()
                        .subtract(ls.getPaidPrincipal())
                        .subtract(ls.getPaidInterest());
                if (need.signum() <= 0) continue;

                var req = RepaymentRequestDTO.builder()
                        .amount(need)
                        .paymentTime(LocalDateTime.now(ZoneId.of("Asia/Seoul")))
                        .installmentNo(ls.getInstallmentNo())
                        .idempotencyKey("AUTO-" + loan.getLNo() + "-" + today)
                        .build();
                repaymentService.repay(loan.getLNo(), req);
            } catch (Exception e) {      // 잔액 부족의 경우 연체 적재
                boolean insufficient = isInsufficientBalance(e)
                        || (e.getMessage() != null && e.getMessage().contains("잔액 부족"));

                if (insufficient) {
                    var loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();


                    // [DELINQ-1] 일할 연체이자 계산
                    var overdueAmt = ls.getDueTotal()
                            .subtract(ls.getPaidPrincipal())
                            .subtract(ls.getPaidInterest());

                    var penMarginPct = new BigDecimal("2.0");           // 임시
                    var capPct = new BigDecimal("20.0");          // 임시
                    var baseRatePct = new BigDecimal("10.0");          // 임시
                    var appliedPct = baseRatePct.add(penMarginPct).min(capPct);

                    var todayDel = overdueAmt
                            .multiply(appliedPct).divide(new BigDecimal("100"))
                            .divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);

                    log.warn("@@@@@@@@@@ DELINQUENCY 테이블 적재 시작: loan={}, ls={}, overdue={}, todayDel={}",
                            loan.getLNo(), ls.getLsNo(), overdueAmt, todayDel);

                    delinquencyService.upsertDailySnapshot(
                            loan.getLNo(),
                            ls.getLsNo(),
                            today,
                            penMarginPct,
                            capPct,
                            appliedPct,
                            overdueAmt.max(BigDecimal.ZERO),
                            todayDel.max(BigDecimal.ZERO),
                            "N",
                            "auto-debit failed"
                    );
                    log.warn("@@@@@@@@@@ 잔액부족 - 자동상환 실패 : lsNo={}, cause={}", ls.getLsNo(), e.getMessage());

                } else {
                    log.warn("@@@@@@@@@@ 자동상환 실패(기타) : lsNo={}, cause={}", ls.getLsNo(), e.getMessage(), e);
                }
            }
        }
        SIM_OFFSET_MONTHS++;
        log.info("@@@@@@@@@@ [SIM] month advanced: offsetMonths={}, newToday={}",
                SIM_OFFSET_MONTHS, simToday());


//        for (LoanSchedule ls : dues) {
//            try {
//                Loan loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();
//                BigDecimal need = ls.getDueTotal().subtract(ls.getPaidPrincipal()).subtract(ls.getPaidInterest());
//                if (need.compareTo(BigDecimal.ZERO) <= 0) {
//                    continue;
//                }
//                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
//                        .amount(need)                         // 회차 잔액 전액
//                        .paymentTime(LocalDateTime.now())     // 지금 시각
//                        .installmentNo(ls.getInstallmentNo()) // 타깃 회차 지정
//                        .idempotencyKey("AUTO-" + loan.getLNo() + "-" + today) // 멱등키
//                        .build();
//                repaymentService.repay(loan.getLNo(), req);
//            } catch (Exception e) {
//                log.warn("Auto-debit failed: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
//            }
//        }
//        log.info("Auto-debit end.");


    }

    // ---- 2) 실패/부분납부 재시도 (매시간 20분)
    @Scheduled(cron = "0 2/5 * * * *", zone = "Asia/Seoul")    // 매5분마다 매시각 2분부터 ex) 10:02분..07분..
    //@Scheduled(cron = "0 20 * * * *", zone = "Asia/Seoul")
    public void retryFailedOrPartial() {
//        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
//        // PARTIAL/FAILED 등 정책에 맞게 조회 (예: 오늘자 + 미수금 있음)
//        List<LoanSchedule> needRetry = scheduleRepo.findNeedRetry(today);
        var today = simToday();
        var needRetry = scheduleRepo.findNeedRetry(today);

        // 가장 먼저 상환부터 갚기
        needRetry.sort(
                java.util.Comparator
                        .comparing(LoanSchedule::getDueDate)
                        .thenComparing(LoanSchedule::getInstallmentNo)
        );
        log.info("@@@@@@@@@@ 상환 재시도 시작: {} items", needRetry.size());

        for (LoanSchedule ls : needRetry) {
            try {
                Loan loan = loanRepo.findById(ls.getLoanNo()).orElseThrow();
                BigDecimal remaining = ls.getDueTotal()
                        .subtract(ls.getPaidPrincipal()).subtract(ls.getPaidInterest());
                if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

                RepaymentRequestDTO req = RepaymentRequestDTO.builder()
                        .amount(remaining)
                        //.paymentTime(LocalDateTime.now())
                        .paymentTime(LocalDateTime.now(ZoneId.of("Asia/Seoul")))
                        .installmentNo(ls.getInstallmentNo())
                        .idempotencyKey("RETRY-" + loan.getLNo() + "-" + today + "-" + System.currentTimeMillis())
                        .build();
                repaymentService.repay(loan.getLNo(), req);

            } catch (Exception e) {
                log.warn("@@@@@@@@@@ 상환 재시도 실패: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
            }
        }
        log.info("@@@@@@@@@@ 상환 재시도 종료.");
    }

    // ---- 3) 연체 판정 & 연체이자 업데이트 (매일 00:10)
     @Scheduled(cron = "0 4/5 * * * *", zone = "Asia/Seoul")       //연체판정: 매시각 4분부터 5분마다
    //@Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void markOverdueAndAccruePenalty() {
        // LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        //  List<LoanSchedule> overdueTargets = scheduleRepo.findOverdueTargets(today);
        var today = simToday();
        var overdueTargets = scheduleRepo.findOverdueTargets(today);
        log.info("@@@@@@@@@@ 연체계산시작: {} items (ref={})", overdueTargets.size(), today);

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
                log.warn("@@@@@@@@@@ 연체 계산 실패: lsNo={}, cause={}", ls.getLsNo(), e.getMessage());
            }
        }
        log.info("@@@@@@@@@@ 연체 계산 종료 .");
    }

    private boolean isInsufficientBalance(Throwable e) {
        // 1) 타입으로 탐지
        while (e != null) {
            if (e instanceof com.boot.eumbank.transfer_domain.transfer.exception.InsufficientBalanceException)
                return true;
            // 패키지가 다를 수도 있으니 간접 판별
            if (e.getClass().getSimpleName().equals("InsufficientBalanceException")) return true;
            e = e.getCause();
        }
        return false;
    }

}
