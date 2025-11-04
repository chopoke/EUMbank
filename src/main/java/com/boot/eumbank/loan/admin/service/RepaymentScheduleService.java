package com.boot.eumbank.loan.admin.service;


import com.boot.eumbank.loan.entity.Loan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service @Slf4j @RequiredArgsConstructor
public class RepaymentScheduleService {

    @Transactional
    public void generate(Loan loan){
        // 상환테이블에 스케쥴 생성
        String type = loan.getRepayMethod(); // 한글 문자열
//        switch (type) {
//            case "원리금균등" -> generateAnnuity(loan);
//            case "원금균등(분할상환)" -> generatePrincipalEqual(loan);
//            case "만기일시" -> generateBullet(loan);
//            default -> throw new IllegalArgumentException("지원하지 않는 상환유형: " + type);
//        }
    }

//    private void generateAnnuity(Loan loan) {
//        // 월 이자율 r, 기간 n, 원리금균등: A = P * r / (1 - (1+r)^-n)
//        // 각 회차별 이자/원금 분해해서 scheduleRepository.saveAll(...)
//    }

//        private void generatePrincipalEqual(Loan loan) {
//        // 매월 원금 고정, 이자는 잔액 * r
//    }

    //    private void generateBullet(Loan loan) {
//        // 매월 이자만, 만기일에 원금 전액
//    }
}
