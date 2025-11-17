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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAdminService {

    private final JPQLQueryFactory qf;
    private final CustomerRepo customerRepo;
    //  계좌 레포지토리 연결 시 주석 해제
    // private final AccountRepo accountRepo;

    private String toStatusKo(String status) {
        if (status == null) return "-";
        return switch (status.toUpperCase()) {
            case "ACTIVE"   -> "정상";
            case "INACTIVE" -> "휴면";
            case "BLOCKED"  -> "정지";
            default         -> status;
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

    private CustomerAdminRow map(Customer c) {
        return new CustomerAdminRow(
                c.getCustomerNo(),
                c.getCNameKr(),
                c.getEmail(),
                c.getCCreatedAt(),
                toStatusKo(c.getCStatus()),
                toRiskKo(c.getCRiskGrade())
        );
    }

    @Transactional(readOnly = true)
    public Page<CustomerAdminRow> list(String keyword, String status, int page, int size) {
        var C = QCustomer.customer;
        var where = new BooleanBuilder();

        if (status != null && !"All".equalsIgnoreCase(status) && !status.isBlank()) {
            where.and(C.cStatus.equalsIgnoreCase(status));
        }

        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            where.and(C.cNameKr.containsIgnoreCase(kw)
                    .or(C.email.containsIgnoreCase(kw)));
        }

        int pageNo = Math.max(page, 0);
        int pageSize = Math.max(size, 1);

        var content = qf.selectFrom(C)
                .where(where)
                .orderBy(C.cCreatedAt.desc())
                .offset((long) pageNo * pageSize)
                .limit(pageSize)
                .fetch();

        Long total = qf.select(C.count()).from(C).where(where).fetchOne();

        List<CustomerAdminRow> rows = content.stream().map(this::map).toList();
        return new PageImpl<>(rows, PageRequest.of(pageNo, pageSize), total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public CustomerAdminStats stats() {
        var C = QCustomer.customer;

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

    /* ===== 상태/정지 ===== */

    /** 고객 정지 */
    @Transactional
    public void freezeCustomer(Integer id) {
        var c = customerRepo.findById(id).orElseThrow();
        c.updateStatus("BLOCKED");
        customerRepo.save(c);

        // (선택) 고객 모든 계좌 정지
        // accountRepo.freezeAllByCustomer(id);
    }

    /** ✅ 고객 정지 해제 */
    @Transactional
    public void unfreezeCustomer(Integer id) {
        var c = customerRepo.findById(id).orElseThrow();
        c.updateStatus("ACTIVE"); // 또는 정책에 따라 INACTIVE로 복귀
        customerRepo.save(c);

        // (선택) 고객 모든 계좌 정지 해제
        // accountRepo.unfreezeAllByCustomer(id);
    }

    @Transactional
    public void toggleStatus(Integer id) {
        var c = customerRepo.findById(id).orElseThrow();
        String next = "ACTIVE".equalsIgnoreCase(c.getCStatus()) ? "INACTIVE" : "ACTIVE";
        c.updateStatus(next);
        customerRepo.save(c);
    }

    @Transactional(readOnly = true)
    public CustomerAdminRow detail(Integer id) {
        return customerRepo.findById(id).map(this::map).orElseThrow();
    }
}
