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

    /* ---------------- 공통 유틸 ---------------- */
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
    // Long 캐스팅
    private static Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return new BigDecimal(o.toString().trim()).longValue(); }
        catch (Exception e) { return null; }
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

    /* ---------------- 목록 조회 ---------------- */
    public List<MyDepositDTO> myDeposits(int cNo) {              // 예금: 평탄 DTO 그대로
        return depositRepo.findMyDeposits(cNo);
    }

    public List<SavingItemDto> mySavings(int cNo) {

        // 적금
        return repo.findMySavings(cNo).stream()
                .map(this::toSavingDtoWithHistory)
                .toList();
    }

    public List<LoanItemDto> myLoans(int cNo) {                  // 대출
        return repo.findMyLoans(cNo).stream()
                .map(this::toLoanDto)
                .toList();
    }

    /* --------- 적금 평탄화 --------- */
    private SavingItemDto toSavingDtoWithHistory(Map<String, Object> m) {
        Integer totalRounds = asInt(m.get("totalInstallments"));
        if (totalRounds == null) totalRounds = asInt(m.get("i_month"));

        // ▶ 진행 회차: i_count_period(= paidInstallments) 우선
        Integer paidInstallments = asInt(m.get("paidInstallments"));   // i_count_period
        Integer iPaid            = asInt(m.get("iPaidInstallments"));  // 레거시 i_paid_installments

        // null 인 경우에만 레거시 값으로 보정 (0은 정상 값이므로 그대로 둔다)
        if (paidInstallments == null) {
            paidInstallments = iPaid;
        }

        Integer monthlyAmount = asInt(m.get("monthlyAmount"));

        // ▶ 현재 원금 잔액: i_principal_bal(alias iPrincipalBal) 사용
        Long principalBalance = asLong(
                m.get("iPrincipalBal") != null
                        ? m.get("iPrincipalBal")
                        : m.get("principalBalance")
        );

        Long expectedMaturityAmount = asLong(
                m.get("expectedMaturityAmount") != null
                        ? m.get("expectedMaturityAmount")
                        : m.get("i_expected_maturity_amount")
        );

        return SavingItemDto.builder()
                .id(pickStr(m, "id"))
                .productName(pickStr(m, "productName", "ip_name"))
                .totalInstallments(totalRounds)
                .paidInstallments(paidInstallments == null ? 0 : paidInstallments)
                .monthlyAmount(monthlyAmount == null ? 0 : monthlyAmount)
                .nextDueDate(pickStr(m, "nextDueDate"))
                .principalBalance(principalBalance)
                .expectedMaturityAmount(expectedMaturityAmount)

                .ipName(pickStr(m, "ipName", "ip_name", "productName"))
                .ipType(pickStr(m, "ipType", "ip_type"))
                .ipRate(pickStr(m, "ipRate", "ip_rate"))
                .ipMinMonths(asInt(m.get("ipMinMonths")))
                .ipMaxMonths(asInt(m.get("ipMaxMonths")))
                .ipMinMonthlyAmount(asInt(m.get("ipMinMonthlyAmount")))
                .ipMaxMonthlyAmount(asInt(m.get("ipMaxMonthlyAmount")))
                .ipInterestPaymentType(pickStr(m, "ipInterestPaymentType"))
                .ipEarlyTerminationRate(pickStr(m, "ipEarlyTerminationRate"))
                .ipFeature(pickStr(m, "ipFeature"))
                .ipButtonText(pickStr(m, "ipButtonText"))
                .ipHref(pickStr(m, "ipHref"))
                .build();
    }

    /* --------- 대출 평탄화 (모달 키와 1:1) --------- */
    private LoanItemDto toLoanDto(Map<String, Object> m) {
        return new LoanItemDto(
                pickStr(m, "id"),
                pickStr(m, "productName"),
                asBD(m.get("principal")),
                asBD(m.get("balance")),
                asBD(m.get("rate")),
                asInt(m.get("termMonths")),
                pickStr(m, "openedAt"),
                pickStr(m, "maturityAt"),
                pickStr(m, "loanType"),
                pickStr(m, "repayMethod"),
                pickStr(m, "rateType"),
                pickStr(m, "lender")
        );
    }

    /* ====== 레거시(필요시) ====== */
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
        product.put("dpMinAmount", asBD(m.get("dpMinAmount")));
        product.put("dpMaxAmount", asBD(m.get("dpMaxAmount")));
        product.put("dpMinMonths", asInt(m.get("dpMinMonths")));
        product.put("dpMaxMonths", asInt(m.get("dpMaxMonths")));
        product.put("dpEarlyTerminationRate", asBD(m.get("dpEarlyTerminationRate")));
        product.put("dpInterestPaymentType",  pickStr(m, "dpInterestPaymentType"));
        product.put("dpRate",                  asBD(m.get("dpRate")));
        product.put("dpFeature",               pickStr(m, "dpFeature"));
        product.put("dpButtonText",            pickStr(m, "dpButtonText"));
        product.put("dpHref",                  pickStr(m, "dpHref"));

        return DepositItemDto.builder()
                .id(pickStr(m, "id"))
                .productName(pickStr(m, "productName"))
                .balance(asInt(m.get("dPrincipalBal")))
                .goalAmount(asInt(m.get("dAmount")))
                .openedAt(pickStr(m, "openedAt"))
                .maturityAt(pickStr(m, "maturityAt"))
                .build();
    }
}
