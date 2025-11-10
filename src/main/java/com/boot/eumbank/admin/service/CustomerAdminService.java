// src/main/java/com/boot/eumbank/admin/service/CustomerAdminService.java
package com.boot.eumbank.admin.service;

import com.boot.eumbank.admin.dto.CustomerAdminRow;
import com.boot.eumbank.admin.dto.CustomerAdminStats;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.JPQLQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAdminService {

    private final JPQLQueryFactory qf;
    private final CustomerRepo customerRepo;

    /* ===== 코드 → 한글 ===== */

    private String toStatusKo(String status) {
        if (status == null) return "-";
        return switch (status.toUpperCase()) {
            case "ACTIVE"   -> "정상";
            case "INACTIVE" -> "휴면";
            case "BLOCKED"  -> "정지";
            default         -> status;
        };
    }

    private String toVerificationKo(Integer level) {
        if (level == null) return "대기중";
        return switch (level) {
            case 2  -> "인증완료";
            case 0  -> "거부됨";
            default -> "대기중"; // 1 또는 기타
        };
    }

    private String toRiskKo(String risk) {
        if (risk == null) return "-";
        return switch (risk.toUpperCase()) {
            case "LOW"       -> "낮음";
            case "MEDIUM"    -> "보통";
            case "HIGH"      -> "높음";
            case "VERY_HIGH" -> "매우 높음";
            default          -> risk;
        };
    }

    /* ===== Entity -> Row DTO ===== */

    private CustomerAdminRow map(Customer c) {
        return new CustomerAdminRow(
                c.getCustomerNo(),                // id
                c.getCNameKr(),                   // name
                c.getCCreatedAt(),                // joinDate(Instant)
                toStatusKo(c.getCStatus()),       // 상태(한글)
                toVerificationKo(c.getCAuthLevel()), // 인증(한글)
                toRiskKo(c.getCRiskGrade())       // 위험등급(한글)
        );
    }

    /* ===== 목록 ===== */

    @Transactional(readOnly = true)
    public Page<CustomerAdminRow> list(String keyword, String status, String verification, int page, int size) {
        QCustomer C = QCustomer.customer;
        BooleanBuilder where = new BooleanBuilder();

        // 상태 필터: ACTIVE/INACTIVE/BLOCKED/All
        if (status != null && !"All".equalsIgnoreCase(status) && !status.isBlank()) {
            where.and(C.cStatus.equalsIgnoreCase(status));
        }

        // 인증상태 필터: Verified/Pending/Rejected (select의 value는 영어 유지)
        if (verification != null && !verification.isBlank()) {
            switch (verification.toUpperCase()) {
                case "VERIFIED" -> where.and(C.cAuthLevel.eq(2));
                case "REJECTED" -> where.and(C.cAuthLevel.eq(0));
                case "PENDING"  -> where.and(C.cAuthLevel.eq(1));
                default -> { /* ignore */ }
            }
        }

        // 키워드: 이름 부분검색 (세 글자 이하도 통과)
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            where.and(C.cNameKr.containsIgnoreCase(kw));
        }

        int pageNo = Math.max(page, 0);
        int pageSize = Math.max(size, 1);

        var content = qf.selectFrom(C)
                .where(where)
                .orderBy(C.cCreatedAt.desc())
                .offset((long) pageNo * pageSize)
                .limit(pageSize)
                .fetch();

        Long total = qf.select(C.count())
                .from(C)
                .where(where)
                .fetchOne();

        List<CustomerAdminRow> rows = content.stream().map(this::map).toList();
        return new PageImpl<>(rows, PageRequest.of(pageNo, pageSize), total == null ? 0 : total);
    }

    /* ===== 집계 ===== */

    @Transactional(readOnly = true)
    public CustomerAdminStats stats() {
        QCustomer C = QCustomer.customer;

        long total       = nvl(qf.select(C.count()).from(C).fetchOne());
        long active      = nvl(qf.select(C.count()).from(C).where(C.cStatus.eq("ACTIVE")).fetchOne());
        long pending     = nvl(qf.select(C.count()).from(C).where(C.cAuthLevel.eq(1)).fetchOne());
        long verified    = nvl(qf.select(C.count()).from(C).where(C.cAuthLevel.eq(2)).fetchOne());
        long pep         = nvl(qf.select(C.count()).from(C).where(C.cIsPep.eq("Y")).fetchOne());
        long sanctionHit = nvl(qf.select(C.count()).from(C).where(C.cIsSanctionHit.eq("Y")).fetchOne());
        long highRisk    = nvl(qf.select(C.count()).from(C).where(C.cRiskGrade.in("HIGH","VERY_HIGH")).fetchOne());

        return new CustomerAdminStats(total, active, pending, verified, pep, sanctionHit, highRisk);
    }

    private long nvl(Long v) { return v == null ? 0L : v; }

    /* ===== 상태/인증 토글 ===== */

    @Transactional
    public void toggleStatus(Integer id) {
        Customer c = customerRepo.findById(id).orElseThrow();
        String next = "ACTIVE".equalsIgnoreCase(c.getCStatus()) ? "INACTIVE" : "ACTIVE";
        c.updateStatus(next);
        customerRepo.save(c);
    }

    @Transactional
    public void setVerification(Integer id, String action) {
        Customer c = customerRepo.findById(id).orElseThrow();
        int level = switch (action.toLowerCase()) {
            case "approve", "verify" -> 2;
            case "reject" -> 0;
            default -> 1; // pending
        };
        c.updateAuthLevel(level);
        customerRepo.save(c);
    }

    @Transactional(readOnly = true)
    public CustomerAdminRow detail(Integer id) {
        return customerRepo.findById(id).map(this::map).orElseThrow();
    }
}
