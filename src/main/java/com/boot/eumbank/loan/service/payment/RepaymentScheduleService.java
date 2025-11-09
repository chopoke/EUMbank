package com.boot.eumbank.loan.service.payment;


import com.boot.eumbank.loan.entity.Loan;
import com.boot.eumbank.loan.entity.LoanSchedule;
import com.boot.eumbank.loan.repository.payment.LoanScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;


/**
 * 상환 스케쥴 생성
 */
@Service @Slf4j @RequiredArgsConstructor
public class RepaymentScheduleService {

    private final LoanScheduleRepository scheduleRepo;

    @Transactional
    public void generate(Loan loan) {
        // 상환테이블에 스케쥴 생성
        String type = normRepayMethod(loan.getRepayMethod());
        Integer nTermMonth = loan.getTermMonth();
        BigDecimal prinAmount = loan.getPrincipalAmount();
        BigDecimal annual = loan.getInterestRate();                  // %값
        LocalDate start = loan.getStartDate().toLocalDate();        // 집행일
        int payday = clamp(loan.getPayDay(), 1, 28);

        if (nTermMonth == null || nTermMonth <= 0) {
            throw new IllegalArgumentException("기간(개월)이 올바르지 않습니다.");
        }
        if (prinAmount == null || prinAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("대출원금이 0 이하이면 스케줄을 생성할 수 없습니다.");
        }
        if (annual == null) {
            throw new IllegalArgumentException("연이율(%)이 필요합니다.");
        }

        switch (type) {
            case "원리금균등" -> generateAnnuity(loan.getLNo(), prinAmount, annual, nTermMonth, start, payday);
            case "원금균등(분할상환)" -> generatePrincipalEqual(loan.getLNo(), prinAmount, annual, nTermMonth, start, payday);
            case "만기일시" -> generateBullet(loan.getLNo(), prinAmount, annual, nTermMonth, start, payday);
            default -> throw new IllegalArgumentException("지원하지 않는 상환유형: " + type);
        }
    }

    // // 원리금균등: A = P * r / (1 - (1+r)^-n) = P * r / (1 - 1/(1+r)^n)
    private void generateAnnuity (Long lNo, BigDecimal prinAmount, BigDecimal annual,int n, LocalDate start,int payDay){
        MathContext mc = new MathContext(20, RoundingMode.HALF_UP);
        BigDecimal r = monthlyRate(annual); // 월이율
        BigDecimal onePlusR = BigDecimal.ONE.add(r);       

        // A = P * r / (1 - (1+r)^-n) = P * r / (1 - 1/(1+r)^n)
        BigDecimal pow = onePlusR.pow(n, mc);
        BigDecimal denom = BigDecimal.ONE.subtract(BigDecimal.ONE.divide(pow, mc));
        BigDecimal A = prinAmount.multiply(r, mc).divide(denom, 10, RoundingMode.HALF_UP);

        BigDecimal bal = prinAmount;
        for (int k = 1; k <= n; k++) {
            LocalDate due = dueDate(start, k, payDay);
            BigDecimal interest = bal.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = A.subtract(interest).setScale(2, RoundingMode.HALF_UP);
            if (k == n) principal = bal.setScale(2, RoundingMode.HALF_UP);      //마지막 보정
            BigDecimal total = principal.add(interest);

            save(lNo, k, due, principal, interest, total);
            bal = bal.subtract(principal);
        }
    }

    // 원금균등: 매월 원금 P/n 고정, 이자는 잔액*r
    private void generatePrincipalEqual (Long lNo, BigDecimal prinAmount, BigDecimal annual,int n, LocalDate start,
    int payDay){
        BigDecimal r = monthlyRate(annual);
        BigDecimal prinEach = prinAmount.divide(new BigDecimal(n), 10, RoundingMode.HALF_UP);
        BigDecimal bal = prinAmount;

        for (int k = 1; k <= n; k++) {
            LocalDate due = dueDate(start, k, payDay);
            BigDecimal interest = bal.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = (k == n) ? bal.setScale(2, RoundingMode.HALF_UP)
                    : prinEach.setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = principal.add(interest);

            save(lNo, k, due, principal, interest, total);
            bal = bal.subtract(principal);
        }
    }

    // 만기일시: 매월 이자만, 마지막 회차에 원금 전액
    private void generateBullet (Long lNo, BigDecimal prinAmount, BigDecimal annual,int n, LocalDate start,
    int payDay){
        BigDecimal r = monthlyRate(annual);
        for (int k = 1; k <= n; k++) {
            LocalDate due = dueDate(start, k, payDay);
            BigDecimal interest = prinAmount.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = (k == n) ? prinAmount.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2);
            BigDecimal total = principal.add(interest);

            save(lNo, k, due, principal, interest, total);
        }
    }


    //  ============= 저장 ((공통로직)
    private void save (Long lNo,int instNo, LocalDate due, BigDecimal prinAmount, BigDecimal i, BigDecimal t){
        LoanSchedule ls = LoanSchedule.builder()
                .loanNo(lNo)
                .installmentNo(instNo)
                .dueDate(due)
                .duePrincipal(prinAmount)
                .dueInterest(i)
                .dueTotal(t)
                .paidPrincipal(BigDecimal.ZERO)
                .paidInterest(BigDecimal.ZERO)
                .status("DUE")
                .build();
        scheduleRepo.save(ls);
    }


    // =============================
    // 헬퍼유틸
    // annualPct(%) → 월이율 r
    private static BigDecimal monthlyRate (BigDecimal annual){
        return annual.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
                .divide(new BigDecimal("12"), 10, RoundingMode.HALF_UP);
    }
    private static LocalDate dueDate (LocalDate start,int k, int payDay){
        LocalDate base = start.plusMonths(k-1);
        int day = Math.min(payDay, base.lengthOfMonth());
        return LocalDate.of(base.getYear(), base.getMonth(), day);
    }
    private static int clamp ( int v, int min, int max){
        return Math.max(min, Math.min(max, v));
    }

    // 한글 문자열 정규화
    private static String normRepayMethod(String raw) {
        if (raw == null) return "원리금균등";
        String s = raw.trim();
        String u = s.toUpperCase();

        // 한글/영문 키워드 기반 정규화
        if (u.contains("원리금") || u.contains("ANNUITY") || u.contains("EQUAL PRINCIPAL+INTEREST")) {
            return "원리금균등";
        }
        if (u.contains("원금균등") || u.contains("PRINCIPAL") || u.contains("EQUAL PRINCIPAL")) {
            return "원금균등(분할상환)";
        }
        if (u.contains("만기") || u.contains("BULLET") || u.contains("INTEREST ONLY")) {
            return "만기일시";
        }
        // 혹시 이미 완전한 표기가 들어오면 그대로
        return s;
    }

}

