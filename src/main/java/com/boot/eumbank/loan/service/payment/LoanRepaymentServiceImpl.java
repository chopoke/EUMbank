package com.boot.eumbank.loan.service.payment;

import com.boot.eumbank.loan.admin.service.AccountTxnServiceImpl;
import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.dto.payment.RepaymentResponseDTO;
import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanPayment;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.repository.LoanRepository;
import com.boot.eumbank.loan.repository.delinquency.LoanDelinquencyRepository;
import com.boot.eumbank.loan.repository.payment.LoanPaymentRepository;
import com.boot.eumbank.loan.repository.payment.LoanScheduleRepository;
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
import java.util.stream.Collectors;


/**
 * 들어온 상환금을 회차별로 배분하고 대출잔액 갱신
 * 연체금 -> 이자 -> 원금 순으로 확인하고 상환
 * 계좌출금, 스케쥴, 대출잔액, 삳환내역을 한번에 일관되게 처리
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LoanRepaymentServiceImpl implements LoanRepaymentService {

    private final LoanRepository loanRepo;
    private final LoanScheduleRepository scheduleRepo;
    private final LoanPaymentRepository paymentRepo;
    private final AccountTxnServiceImpl accountTxn;     // 출금용 서비스
    private final LoanDelinquencyRepository delinquencyRepo;        // 연체 레포



    private static final BigDecimal ZERO = new BigDecimal("0.00");

    // -------- 유틸
    private static BigDecimal nvl(BigDecimal v) {
        return v == null ? ZERO : v.setScale(2, RoundingMode.HALF_UP);
    }
    private static BigDecimal min(BigDecimal a, BigDecimal b) {
        return (a.compareTo(b) <= 0) ? a : b;
    }

    private String nextPaymentId() {

        //String date = loanClock.today().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String date = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rnd = String.format("%06d", new java.util.Random().nextInt(1_000_000));
        return "RP" + date + "-" + rnd;
    }

    /**
     * 상환을 도맡아하는 메서드
     * @param loanNo  대출번호
     * @param req     상환요청 DTO
     * @return        상환
     */
    @Override
    @Transactional
    public RepaymentResponseDTO repay(Long loanNo, RepaymentRequestDTO req) {


        // (1) 동시성 락  설정 !!! -> 동일 대출에 대해 상환이 들어와도 꼬이지 않게 유지하기 위해 DB에서부터 락
        scheduleRepo.lockLoanRow(loanNo);

        Loan loan = loanRepo.findById(loanNo)
                .orElseThrow(() -> new IllegalArgumentException("대출건이 없습니다. " + loanNo));

        BigDecimal receive = nvl(req.getAmount());
        if (receive.compareTo(ZERO) <= 0) {
            throw new IllegalArgumentException("상환금액은 0보다 커야합니다.");
        }

        // 없으면 now()로 대체 저장하기
        LocalDateTime payTime = Optional.ofNullable(req.getPaymentTime())
                .orElse(LocalDateTime.now());
//        LocalDateTime payTime = Optional.ofNullable(req.getPaymentTime())
//                .orElse(loanClock.now());


        // ------------------------ 2단계!
        // 멱등키 준비 (상환요청키) LoanBatchService에서 보낸 AUTO... 나  RETRY... 키
        String lpGroupId = nextPaymentId();
        String idem = Optional.ofNullable(req.getIdempotencyKey()).orElse(lpGroupId);

        // 멱등키가 이미 처리되어 있으ㅁ면 직전 결과를 통해 응답만 다시 구성해쥼
        if (paymentRepo.existsByLoanNoAndIdempotencyKey(loanNo, idem)) {
            return buildSnapshotFromPayments(loanNo, idem); // 아래 헬퍼 참고
        }

        // --------------------------- 3단계!
        // (2) 상환 대상 스케줄 조회
        List<LoanSchedule> targets;

        if (req.getInstallmentNo() != null) {
            targets = scheduleRepo.findRepayTargets(loanNo).stream()        // 미납, 부분납, 연체납 등 내야할거 찾기
                    .filter(s -> Objects.equals(s.getInstallmentNo(), req.getInstallmentNo()))
                    .collect(Collectors.toList());
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("해당 회차는 상환 대상이 아닙니다.");
            }

        } else if (req.getScheduleId() != null) {
            targets = scheduleRepo.findRepayTargets(loanNo).stream()
                    .filter(s -> Objects.equals(s.getLsNo(), req.getScheduleId()))
                    .collect(Collectors.toList());
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("해당 스케줄은 상환 대상이 아닙니다.");
            }

        } else {
            // findRepayTargets 결과도 가변 리스트로 한번 감싸두기
            targets = new ArrayList<>(scheduleRepo.findRepayTargets(loanNo));
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("상환 대상 스케줄이 없습니다.");
            }
        }
        // 가장 빠른상환부터 상환!
        targets.sort(
                java.util.Comparator
                        .comparing(LoanSchedule::getDueDate)               // 납기일 오름차순
                        .thenComparing(LoanSchedule::getInstallmentNo)     // 같으면 회차번호 오름차순
        );

        // ---------------------------------- 4단계!
        //  연체료 먼저 확인 (LoanDelinquencySercice가 쌓아준 스냅샷 합산-> (연체총액 - 납부한연체액 = 안낸 연체액) 도출
        // (2-0) 연체료 미지급액 계산 (대출 단위)
        BigDecimal accruedPenalty = nvl(delinquencyRepo.sumDelAmountByLoanUntil(loanNo, payTime));  // 적립된 연체료 합
        BigDecimal paidPenalty    = nvl(paymentRepo.sumPenaltyPaidByLoanUntil(loanNo, payTime));    // 납부된 연체료 합
        BigDecimal outstandingPenalty = accruedPenalty.subtract(paidPenalty);
        if (outstandingPenalty.signum() < 0) outstandingPenalty = ZERO;

        // ----------------------------------- 5단계!
        // (2-1) 스케줄 미납 금액 계산
        BigDecimal needSchTotal = targets.stream().map(s -> {   // 각 타겟 스케줄의 미납 이자+원금 합
            BigDecimal needInt = nvl(s.getDueInterest()).subtract(nvl(s.getPaidInterest()));
            if (needInt.signum() < 0) needInt = ZERO;
            BigDecimal needPrin = nvl(s.getDuePrincipal()).subtract(nvl(s.getPaidPrincipal()));
            if (needPrin.signum() < 0) needPrin = ZERO;
            return needInt.add(needPrin);
        }).reduce(ZERO, BigDecimal::add);

        BigDecimal needTotal = outstandingPenalty.add(needSchTotal);

        // 요청금액과 실제 필요액 중 작은 값 (과납방지)
        BigDecimal withdrawAmt = receive.min(needTotal);
        if (withdrawAmt.compareTo(ZERO) <= 0) {
            throw new IllegalArgumentException("이번 회차에 납부할 금액이 없습니다.");
        }

        // ----------------------------- 6단계!
        // === (2-2) 실제 출금 (계좌 잔액 차감 + transfer_history_tbl 적재) ===
        Integer repayA = loan.getRepayAccount();            // ACCOUNT_TBL.a_no 여야 함
        LocalDateTime now = payTime;
        // 멱등키 기반 transferId (20자 제한 고려해 짧게)
        String transferId = ("LOANRP-" + loanNo + "-" + idem).replaceAll("[^A-Za-z0-9-]", "");
        if (transferId.length() > 20) transferId = transferId.substring(0, 20);
        String memo = "[대출상환] "+ " 회차:" +
                (req.getInstallmentNo() != null ? req.getInstallmentNo() : "다수");

        // 동일 트랜잭션 내에서 출금 시도하는데, 실패 시 전체 롤백
        accountTxn.withdraw(
                repayA,
                withdrawAmt,
                now,
                memo,
                transferId,
                "LOAN_REPAYMENT",   // th_transfer_type
                "WITHDRAWAL",                   // th_transaction_type
                "EUMBANK",                      // th_other_bank
                null                            // th_other_account
        );

        // (3) 배분
        int seq = 0;

        BigDecimal appliedInterestTotal = ZERO;
        BigDecimal appliedPrincipalTotal = ZERO;
        BigDecimal appliedPenaltyTotal = ZERO;

        List<RepaymentResponseDTO.Item> items = new ArrayList<>();
        BigDecimal remain = withdrawAmt;

        // --------------------------------------- 7단계!
        // (3-0) 연체료 먼저 충당  연체료 -> 이자 -> 원금 순
        if (outstandingPenalty.compareTo(ZERO) > 0 && remain.compareTo(ZERO) > 0) {

            BigDecimal payPenalty = min(remain, outstandingPenalty);
            remain = remain.subtract(payPenalty);           // 남은금액
            // 남은금액(remain)으로 약정이자(needInterest), 약정원금(needPrincipal)채우기
            // 전부 채워졌으면 paid, 일부면 partial

            seq++;
            String lpId = lpGroupId + "-" + String.format("%02d", seq);
            LoanPayment p = LoanPayment.builder()
                    .loanNo(loanNo)
                    .idempotencyKey(idem)
                    .lpId(lpId)
                    .amountReceived(payPenalty) // penalty만 납부
                    .principalAmt(ZERO)
                    .interestAmt(ZERO)
                    .penaltyAmt(payPenalty)
                    .status("POSTED")
                    .installmentNo(null)     // 대출 단위 벌금 충당
                    .paymentTime(payTime)
                    .scheduleId(null)
                    .build();
            paymentRepo.save(p);
            appliedPenaltyTotal = appliedPenaltyTotal.add(payPenalty);

            items.add(RepaymentResponseDTO.Item.builder()
                    .installmentNo(null)
                    .scheduleId(null)
                    .appliedInterest(ZERO)
                    .appliedPrincipal(ZERO)
                    .appliedPenalty(payPenalty)     // vㅐ널티
                    .newStatus(null)
                    .lpId(lpId)
                    .build());
        }

        // 이자 -> 원금 순으로 배분
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
                        .idempotencyKey(idem)
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
                        .appliedPenalty(ZERO)
                        .newStatus(s.getStatus())
                        .lpId(lpId)
                        .build());
            }
        }


        // ------------------------ 8 단계!
        // (4) 대출 잔액/상태 갱신
        // 원금상환분만 Balance에서 차감  ==> 0되면 종료
        BigDecimal curBal = nvl(loan.getBalance());
        if (curBal.compareTo(ZERO) > 0) {
            curBal = curBal.subtract(appliedPrincipalTotal);
            if (curBal.compareTo(ZERO) < 0) curBal = ZERO;
            loan.setBalance(curBal);
        }

        // 최근 납부시간 갱신
        loan.setLastPaidAt(payTime);

        if (curBal.compareTo(ZERO) <= 0) {
            curBal = curBal.subtract(appliedPrincipalTotal);
            if (curBal.compareTo(ZERO) < 0) curBal = ZERO;
            loan.setBalance(curBal);
        }
        // 최근 납부 시각 업데이트
        loan.setLastPaidAt(payTime);

        if (curBal.compareTo(ZERO) <= 0) {
            loan.setStatus("CLOSED");
            loan.setClosedAt(LocalDateTime.now());
        }
        // 저장
        loanRepo.save(loan);

        // (5) 응답
        return RepaymentResponseDTO.builder()
                .loanNo(loanNo)
                .lpGroupId(lpGroupId)
                .receivedTotal(withdrawAmt)                 // 실제 출금금액(상환햇을떄)
                .appliedToInterest(appliedInterestTotal)
                .appliedToPrincipal(appliedPrincipalTotal)
                .appliedToPenalty(appliedPenaltyTotal)
                .remainingAfterApply(remain)
                .allocations(items)
                .build();
    }

    // 멱등키 재호출시 스냅샷 돌려줘야함
    // --> 같은 멱등키로 들어오면 이미 저장된 payment_tbl로 응답 재구성 리턴
    private RepaymentResponseDTO buildSnapshotFromPayments(Long loanNo, String idem) {
        List<LoanPayment> rows = paymentRepo.findAllByLoanNoAndIdempotencyKey(loanNo, idem);
        BigDecimal toInt = ZERO, toPrin = ZERO, toPen = ZERO, recv = ZERO;
        List<RepaymentResponseDTO.Item> items = new ArrayList<>();
        for (LoanPayment p : rows) {
            toInt  = toInt.add(nvl(p.getInterestAmt()));
            toPrin = toPrin.add(nvl(p.getPrincipalAmt()));
            toPen  = toPen.add(nvl(p.getPenaltyAmt()));
            recv   = recv.add(nvl(p.getAmountReceived()));

            items.add(RepaymentResponseDTO.Item.builder()
                    .installmentNo(p.getInstallmentNo())
                    .scheduleId(p.getScheduleId())
                    .appliedInterest(nvl(p.getInterestAmt()))
                    .appliedPrincipal(nvl(p.getPrincipalAmt()))
                    .newStatus(null)                // 필요시 조회해서 채워도 됨
                    .lpId(p.getLpId())
                    .build());
        }
        return RepaymentResponseDTO.builder()
                .loanNo(loanNo)
                .lpGroupId(idem)                    // 멱등키를 그룹ID처럼 노출
                .receivedTotal(recv)
                .appliedToInterest(toInt)
                .appliedToPrincipal(toPrin)
                .appliedToPenalty(toPen)
                .remainingAfterApply(ZERO)      // 재호출은 보통 0
                .allocations(items)
                .build();
    }

}

