package com.boot.eumbank.loan.service.payment;

import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.dto.payment.RepaymentResponseDTO;
import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanPayment;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.repository.LoanRepository;
import com.boot.eumbank.loan.repository.payment.LoanPaymentRepository;
import com.boot.eumbank.loan.repository.payment.LoanScheduleRepository;
import com.boot.eumbank.loan.service.payment.LoanRepaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoanRepaymentServiceImpl implements LoanRepaymentService {

    private final LoanRepository loanRepo;
    private final LoanScheduleRepository scheduleRepo;
    private final LoanPaymentRepository paymentRepo;

    private static final BigDecimal ZERO = new BigDecimal("0.00");

    // -------- utils
    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? ZERO : v.setScale(2, RoundingMode.HALF_UP);
    }
    private static BigDecimal min(BigDecimal a, BigDecimal b) {
        return (a.compareTo(b) <= 0) ? a : b;
    }
    private static String nextPaymentId() {
        String date = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rnd = String.format("%06d", new java.util.Random().nextInt(1_000_000));
        return "RP" + date + "-" + rnd;
    }

    @Override
    @Transactional
    public RepaymentResponseDTO repay(Long loanNo, RepaymentRequestDTO req) {

        // (1) 동시성 락
        scheduleRepo.lockLoanRow(loanNo);

        Loan loan = loanRepo.findById(loanNo)
                .orElseThrow(() -> new IllegalArgumentException("대출건이 없습니다. " + loanNo));

        BigDecimal receive = nvl(req.getAmount());
        if (receive.compareTo(ZERO) <= 0) {
            throw new IllegalArgumentException("상환금액은 0보다 커야합니다.");
        }

        // ✅ 없으면 now()로 대체 (orElseThrow 아님!)
        LocalDateTime payTime = Optional.ofNullable(req.getPaymentTime())
                .orElse(LocalDateTime.now());

        // (2) 상환 대상 스케줄 조회
        List<LoanSchedule> targets;
        if (req.getInstallmentNo() != null) {
            targets = scheduleRepo.findRepayTargets(loanNo).stream()
                    .filter(s -> Objects.equals(s.getInstallmentNo(), req.getInstallmentNo()))
                    .toList();
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("해당 회차는 상환 대상이 아닙니다.");
            }
        } else if (req.getScheduleId() != null) {
            targets = scheduleRepo.findRepayTargets(loanNo).stream()
                    .filter(s -> Objects.equals(s.getLsNo(), req.getScheduleId()))
                    .toList();
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("해당 스케줄은 상환 대상이 아닙니다.");
            }
        } else {
            targets = scheduleRepo.findRepayTargets(loanNo);
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("상환 대상 스케줄이 없습니다.");
            }
        }

        // (3) 배분
        String lpGroupId = nextPaymentId();
        int seq = 0;

        BigDecimal appliedInterestTotal = ZERO;
        BigDecimal appliedPrincipalTotal = ZERO;
        BigDecimal appliedPenaltyTotal = ZERO;

        List<RepaymentResponseDTO.Item> items = new ArrayList<>();
        BigDecimal remain = receive;

        for (LoanSchedule s : targets) {
            if (remain.compareTo(ZERO) <= 0) break;

            BigDecimal dueInt  = nvl(s.getDueInterest());
            BigDecimal paidInt = nvl(s.getPaidInterest());
            BigDecimal duePrin  = nvl(s.getDuePrincipal());
            BigDecimal paidPrin = nvl(s.getPaidPrincipal());

            BigDecimal needInterest  = dueInt.subtract(paidInt);
            if (needInterest.compareTo(ZERO) < 0) needInterest = ZERO;


            BigDecimal needPrincipal = duePrin.subtract(paidPrin);
            if (needPrincipal.compareTo(ZERO) < 0) needPrincipal = ZERO;

            if (needInterest.compareTo(ZERO) == 0 && needPrincipal.compareTo(ZERO) == 0) {
                continue; // 이미 완료된 회차
            }

            BigDecimal payInterest = ZERO;
            BigDecimal payPrincipal = ZERO;

            // 이자 먼저
            if (needInterest.compareTo(ZERO) > 0) {
                payInterest = min(remain, needInterest);
                remain = remain.subtract(payInterest);
            }

            // 그 다음 원금
            if (remain.compareTo(ZERO) > 0 && needPrincipal.compareTo(ZERO) > 0) {
                payPrincipal = min(remain, needPrincipal);
                remain = remain.subtract(payPrincipal);
            }

            // 스케줄 반영 (null-safe)
            s.setPaidInterest(paidInt.add(payInterest).setScale(2, RoundingMode.HALF_UP));
            s.setPaidPrincipal(paidPrin.add(payPrincipal).setScale(2, RoundingMode.HALF_UP));

            BigDecimal stillInterest  = dueInt.subtract(nvl(s.getPaidInterest()));
            BigDecimal stillPrincipal = duePrin.subtract(nvl(s.getPaidPrincipal()));
            boolean fullyPaid = (stillInterest.compareTo(ZERO) <= 0 && stillPrincipal.compareTo(ZERO) <= 0);
            s.setStatus(fullyPaid ? "PAID" : "PARTIAL");

            scheduleRepo.save(s);

            // payment row (회차별)
            if (payInterest.compareTo(ZERO) > 0 || payPrincipal.compareTo(ZERO) > 0) {
                seq++;
                String lpId = lpGroupId + "-" + String.format("%02d", seq);
                LoanPayment p = LoanPayment.builder()
                        .loanNo(loanNo)
                        .lpId(lpId)
                        .amountReceived(payInterest.add(payPrincipal)) // penalty 제외
                        .principalAmt(payPrincipal)
                        .interestAmt(payInterest)
                        .penaltyAmt(ZERO)
                        .status("POSTED")
                        .installmentNo(s.getInstallmentNo())
                        .paymentTime(payTime)
                        .scheduleId(s.getLsNo())
                        .build();
                paymentRepo.save(p);

                appliedInterestTotal = appliedInterestTotal.add(payInterest);
                appliedPrincipalTotal = appliedPrincipalTotal.add(payPrincipal);

                items.add(RepaymentResponseDTO.Item.builder()
                        .installmentNo(s.getInstallmentNo())
                        .scheduleId(s.getLsNo())
                        .appliedInterest(payInterest)
                        .appliedPrincipal(payPrincipal)
                        .newStatus(s.getStatus())
                        .lpId(lpId)
                        .build());
            }
        }

        // (4) 대출 잔액/상태 갱신 (원금만 차감)
        BigDecimal curBal = nvl(loan.getBalance());
        if (appliedPrincipalTotal.compareTo(ZERO) > 0) {
            curBal = curBal.subtract(appliedPrincipalTotal);
            if (curBal.compareTo(ZERO) < 0) curBal = ZERO;
            loan.setBalance(curBal);
        }
        if (curBal.compareTo(ZERO) <= 0) {
            loan.setStatus("CLOSED");
            loan.setClosedAt(LocalDateTime.now());
        }
        loanRepo.save(loan);

        // (5) 응답
        return RepaymentResponseDTO.builder()
                .loanNo(loanNo)
                .lpGroupId(lpGroupId)
                .receivedTotal(receive)
                .appliedToInterest(appliedInterestTotal)
                .appliedToPrincipal(appliedPrincipalTotal)
                .appliedToPenalty(appliedPenaltyTotal)
                .remainingAfterApply(remain)
                .allocations(items)
                .build();
    }
}
