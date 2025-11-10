// src/main/java/com/boot/eumbank/mypage/service/MypageProductService.java
package com.boot.eumbank.mypage.service;

import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.mypage.dto.*;
import com.boot.eumbank.mypage.repository.MypageProductRepository;
import com.boot.eumbank.mypage.repository.MyPageDepositRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MypageProductService {

    private final MypageProductRepository repo;
    private final MyPageDepositRepository depositRepo;
    private final TransferHistoryRepository thRepo;

    /* ================= 공통 유틸 ================= */
    private static Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return new BigDecimal(o.toString().trim()).intValue(); }
        catch (Exception e) { return null; }
    }
    private static BigDecimal asBD(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal b) return b;
        if (o instanceof Number n) return new BigDecimal(n.toString());
        try { return new BigDecimal(o.toString().trim()); }
        catch (Exception e) { return null; }
    }
    private static Double asDouble(Object o) {
        BigDecimal bd = asBD(o);
        return (bd != null) ? bd.doubleValue() : null;
    }
    private static String asStr(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }
    private static String pickStr(Map<String,Object> m, String... keys){
        for (String k : keys) {
            String v = asStr(m.get(k));
            if (v != null) return v;
        }
        return null;
    }
    private Integer pickAccountNo(Map<String, Object> m) {
        Integer aNo = asInt(m.get("aNo"));
        if (aNo == null) aNo = asInt(m.get("accountNo"));
        if (aNo == null) aNo = asInt(m.get("a_no"));
        if (aNo == null) aNo = asInt(m.get("i_account_no"));
        return aNo;
    }

    public int resolveCustomerNo(Principal principal, Integer cno) {
        if (cno != null) return cno;
        if (principal != null && principal.getName() != null && !principal.getName().isBlank()) {
            Integer found = repo.findCustomerNoByUserId(principal.getName());
            if (found != null) return found;
        }
        Integer fallback = currentCustomerNo();
        if (fallback != null) return fallback;
        throw new IllegalStateException("로그인 사용자의 고객번호(c_no)를 식별할 수 없습니다.");
    }
    private Integer currentCustomerNo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return null;
            Object p = auth.getPrincipal();
            if (p instanceof Customer c && c.getCustomerNo() != null) return c.getCustomerNo();
            if (p instanceof UserDetails ud) return repo.findCustomerNoByUserId(ud.getUsername());
            if (p instanceof String s && !s.isBlank()) return repo.findCustomerNoByUserId(s);
        } catch (Exception ignore) {}
        return null;
    }

    /* ============== 목록 조회 ============== */
    public List<SavingItemDto> mySavings(int cNo) {
        return repo.findMySavings(cNo).stream()
                .map(this::toSavingDtoWithHistory)   // 평탄화된 DTO로 매핑
                .toList();
    }

    /** 예금: DTO 전용 리포지토리에서 평탄화된 MyDepositDTO 그대로 반환 */
    public List<MyDepositDTO> myDeposits(int cNo) {
        return depositRepo.findMyDeposits(cNo);
    }

    public List<LoanItemDto> myLoans(int cNo) {
        return repo.findMyLoans(cNo).stream()
                .map(this::toLoanDto)
                .toList();
    }

    /* ============== 적금 매핑 (product 제거, 평탄화) ============== */
    private SavingItemDto toSavingDtoWithHistory(Map<String, Object> m) {
        Integer totalRounds = asInt(m.get("totalInstallments"));
        if (totalRounds == null) totalRounds = asInt(m.get("i_month"));

        Integer paidFromDb = asInt(m.get("paidInstallments"));
        Integer aNo = pickAccountNo(m);

        Integer paidFromHistory = null;
        if (aNo != null) {
            try {
                // 트랜잭션 타입 명은 운영 값에 맞춰 사용
                paidFromHistory = (int) thRepo.countByAccountNoAndTransactionType(aNo, "SAVING_PAY");
            } catch (Exception e) {
                log.warn("[mypage] SAVING_PAY count 실패 aNo={}", aNo, e);
            }
        }
        int finalPaid = (paidFromHistory != null) ? paidFromHistory : (paidFromDb != null ? paidFromDb : 0);

        // 평탄화된 ip* 필드들로 직접 세팅
        return SavingItemDto.builder()
                .id(pickStr(m, "id"))
                .productName(pickStr(m, "productName", "ip_name"))
                .totalInstallments(totalRounds)
                .paidInstallments(finalPaid)
                .monthlyAmount(asInt(m.get("monthlyAmount")))
                .nextDueDate(pickStr(m, "nextDueDate", "nextDue", "nextPayDate"))

                // ----- ip* (Installment Product Spec) -----
                .ipName(pickStr(m, "ipName", "ip_name", "productName"))
                .ipType(pickStr(m, "ipType", "ip_type"))
                .ipRate(pickStr(m, "ipRate", "ip_rate"))
                .ipMinMonths(asInt(m.get("ipMinMonths") != null ? m.get("ipMinMonths") : m.get("ip_min_months")))
                .ipMaxMonths(asInt(m.get("ipMaxMonths") != null ? m.get("ipMaxMonths") : m.get("ip_max_months")))
                .ipMinMonthlyAmount(asInt(m.get("ipMinMonthlyAmount") != null ? m.get("ipMinMonthlyAmount") : m.get("ip_min_monthly_amount")))
                .ipMaxMonthlyAmount(asInt(m.get("ipMaxMonthlyAmount") != null ? m.get("ipMaxMonthlyAmount") : m.get("ip_max_monthly_amount")))
                .ipInterestPaymentType(pickStr(m, "ipInterestPaymentType", "ip_interest_payment_type"))
                .ipEarlyTerminationRate(pickStr(m, "ipEarlyTerminationRate", "ip_early_termination_rate"))
                .ipFeature(pickStr(m, "ipFeature", "ip_feature", "ip_featue"))
                .ipButtonText(pickStr(m, "ipButtonText", "ip_button_text"))
                .ipHref(pickStr(m, "ipHref", "ip_href"))
                .build();
    }

    /* ============== 대출 매핑 ============== */
    private LoanItemDto toLoanDto(Map<String, Object> m) {
        return new LoanItemDto(
                pickStr(m, "id"),
                pickStr(m, "productName"),
                m.get("balance") == null ? null : asBD(m.get("balance")),
                m.get("rate") == null ? null : asBD(m.get("rate")),
                pickStr(m, "openedAt"),
                pickStr(m, "maturityAt")
        );
    }

    /* ====== (선택) 레거시 용 ====== */
    @Deprecated
    public List<DepositItemDto> myDepositsLegacy(int cNo) {
        return repo.findMyDeposits(cNo).stream()
                .map(this::toDepositItemLegacy)
                .toList();
    }
    @Deprecated
    private DepositItemDto toDepositItemLegacy(Map<String, Object> m) {
        Map<String, Object> product = new LinkedHashMap<>();
        product.put("dpName",      pickStr(m, "productName"));
        product.put("dpType",      pickStr(m, "dpType", "dp_type"));
        product.put("dpMinAmount", asBD(m.get("dpMinAmount") != null ? m.get("dpMinAmount") : m.get("dp_min_amount")));
        product.put("dpMaxAmount", asBD(m.get("dpMaxAmount") != null ? m.get("dpMaxAmount") : m.get("dp_max_amount")));
        product.put("dpMinMonths", asInt(m.get("dpMinMonths") != null ? m.get("dpMinMonths") : m.get("dp_min_months")));
        product.put("dpMaxMonths", asInt(m.get("dpMaxMonths") != null ? m.get("dpMaxMonths") : m.get("dp_max_months")));
        product.put("dpEarlyTerminationRate", asBD(m.get("dpEarlyTerminationRate") != null ? m.get("dpEarlyTerminationRate") : m.get("dp_early_termination_rate")));
        product.put("dpInterestPaymentType",  pickStr(m, "dpInterestPaymentType", "dp_interest_payment_type"));
        product.put("dpRate",                  asBD(m.get("dpRate") != null ? m.get("dpRate") : m.get("dp_rate")));
        product.put("dpFeature",               pickStr(m, "dpFeature", "dp_feature"));
        product.put("dpButtonText",            pickStr(m, "dpButtonText", "dp_button_text"));
        product.put("dpHref",                  pickStr(m, "dpHref", "dp_href"));

        return DepositItemDto.builder()
                .id(pickStr(m, "id"))
                .productName(pickStr(m, "productName"))
                .balance(asInt(m.get("dPrincipalBal") != null ? m.get("dPrincipalBal") : m.get("d_principal_bal")))
                .goalAmount(asInt(m.get("dAmount") != null ? m.get("dAmount") : m.get("d_amount")))
                .openedAt(pickStr(m, "openedAt", "openDate", "dJoinDate", "d_join_date"))
                .maturityAt(pickStr(m, "maturityAt", "dMaturityDate", "d_maturity_date"))
                .build();
    }
}
