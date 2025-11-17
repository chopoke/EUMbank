// src/main/java/com/boot/eumbank/risk/service/RiskGradeService.java
package com.boot.eumbank.risk.service;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.risk.entity.DelinquencyEvent;
import com.boot.eumbank.risk.repo.DelinquencyEventRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskGradeService {

    private final DelinquencyEventRepo eventRepo;
    private final CustomerRepo customerRepo;

    /** 자동 차단 (원하면 true) */
    private static final boolean AUTO_BLOCK_ON_HIGH = false;

    /** VERY_HIGH를 HIGH로 병합 여부 */
    private static final boolean COLLAPSE_VERY_HIGH_TO_HIGH = false;

    /** 연체 발생 기록 + 등급 재산정 (항상 새 트랜잭션으로 커밋) */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordDelinquency(Integer customerNo, String category, String memo) {

        // 1) 공통 연체 이벤트 테이블에 INSERT
        DelinquencyEvent event = DelinquencyEvent.builder()
                .customerNo(customerNo)
                .category(category)   // "DEPOSIT" | "SAVING" | "LOAN"
                .memo(memo)
                .build();

        eventRepo.save(event);
        log.info("[RISK] delinquency event saved: cNo={}, category={}, memo={}",
                customerNo, category, memo);

        // 2) 해당 고객 위험등급 재계산
        recalcForCustomer(customerNo);
    }

    /** 등급 재산정 (1명) */
    @Transactional
    public void recalcForCustomer(Integer customerNo) {
        long total = eventRepo.countByCustomerNo(customerNo);
        String grade = mapGrade(total); // LOW / MEDIUM / HIGH / VERY_HIGH

        Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new IllegalArgumentException("고객을 찾을 수 없습니다: " + customerNo));

        customer.updateRiskGrade(grade);

        if (AUTO_BLOCK_ON_HIGH && ("HIGH".equals(grade) || "VERY_HIGH".equals(grade))) {
            customer.updateStatus("BLOCKED");
        }

        // 변경 감지를 쓰면 save는 생략 가능하지만, 안전하게 한 번 더
        customerRepo.save(customer);

        log.info("[RISK] risk grade recalculated: cNo={}, events={}, grade={}",
                customerNo, total, grade);
    }

    /** 전체 재산정 */
    @Transactional
    public void recalcAll() {
        customerRepo.findAll().forEach(c -> recalcForCustomer(c.getCustomerNo()));
    }

    /* 위험등급 규칙 매핑 */
    private String mapGrade(long total) {
        if (total >= 10) return COLLAPSE_VERY_HIGH_TO_HIGH ? "HIGH" : "VERY_HIGH";
        if (total >= 5)  return "HIGH";
        if (total >= 3)  return "MEDIUM";
        return "LOW";
    }
}
