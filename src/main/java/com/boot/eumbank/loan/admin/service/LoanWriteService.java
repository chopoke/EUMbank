package com.boot.eumbank.loan.admin.service;


import com.boot.eumbank.loan.repository.LoanRepository;
import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanApplication;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Loan_TBL + Account_tbl에 계좌 생성하는 서비스로직
 */
@Service @Slf4j @RequiredArgsConstructor
public class LoanWriteService {

    private final LoanRepository loanRepository;

    public Loan createFromApplication(LoanApplication application, LocalDateTime payoutAt, int payDay){
        Loan loan = new Loan();

        String lId = "L-" + (100000 + ThreadLocalRandom.current().nextInt(900000));     //ㄴ나수 주입
        loan.setLId(lId);

        loan.setLaNo(application.getLaNo());
        loan.setCNo(application.getCustomerNo());
        // 대출계좌(집행계좌)를 우선 신청의 payout으로 기록(별도 정책 있으면 교체)
        loan.setANo(application.getPayoutAccountNo());
        loan.setRepayAccount(application.getRepayAccountNo());

        loan.setLpdNo(application.getLoanProductNo());

        // 승인 금액/기간/금리 없으면 신청값으로 폴백
        BigDecimal principal = application.getApprovedAmount() != null
                ? application.getApprovedAmount()
                : application.getAppliedAmount();
        loan.setPrincipalAmount(principal);

        // 금리/상환유형/금리유형 폴백
        loan.setInterestRate(
                application.getApprovedRate() != null
                        ? application.getApprovedRate()
                        : new BigDecimal("6.00"));
        loan.setRateType(
                application.getRateType() != null
                        ? application.getRateType()
                        : "고정금리");
        loan.setRepayMethod(
                application.getRpayType() != null
                        ? application.getRpayType()
                        : "원리금균등");

        // 기간 폴백
        int term = application.getApprovedTerm() != null
                ? application.getApprovedTerm()
                : application.getDesiredTerm();
        loan.setTermMonth(term);

        // 통화
        loan.setCurrency("KRW");
        loan.setSpreadRate(BigDecimal.ZERO);

        // 승인 금액 결정 이후
        loan.setPrincipalAmount(principal);
        //초기 잔액 = 약정원금
        loan.setBalance(principal);

        // 개시/만기/납부일
        int safePayDay = clamp(payDay, 1, 28);
        loan.setStartDate(payoutAt);
        loan.setPayDay(safePayDay);
        loan.setMaturityDate(computeMaturity(payoutAt, term, safePayDay));

        // 상태/시간
        loan.setStatus("ACTIVE");
        loan.setCreatedAt(LocalDateTime.now());
        loan.setClosedAt(null);

        return loanRepository.save(loan);
    }

    // = ============= 만기일 계산 유틸
    // (1) 만기일 계산 유틸 메서드 추가
    private static LocalDateTime computeMaturity(LocalDateTime start, int termMonths, int payDay) {
        // 시작일의 '날짜' 기준으로 termMonths 개월을 더한 달의 같은 일자를 기본으로 잡고,
        // payDay(1~28 권장)를 적용하되, 그 달의 말일보다 클 경우 말일로 보정
        LocalDate base = start.toLocalDate().plusMonths(termMonths);

        int day = Math.max(1, Math.min(28, payDay));   // 1~28로 클램프
        int lastDay = base.lengthOfMonth();
        int targetDay = Math.min(day, lastDay);

        return LocalDateTime.of(
                base.getYear(),
                base.getMonth(),
                targetDay,
                start.getHour(),
                start.getMinute(),
                start.getSecond()
        );
    }

    private static int clamp(int v, int min, int max){
        return Math.max(min, Math.min(max, v));
    }
}
