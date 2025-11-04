package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.dto.*;
import com.boot.eumbank.mypage.repository.MypageProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;

// ✅ 추가 import
import com.boot.eumbank.customer.entity.Customer;
import org.springframework.security.core.userdetails.UserDetails;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MypageProductService {

    private final MypageProductRepository repo;

    /** 로그인 사용자의 고객번호(c_no) 식별 */
    private Integer currentCustomerNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }

        Object principal = auth.getPrincipal();

        // 1) principal이 Customer 엔티티인 경우 (현재 오류 케이스 대응)
        if (principal instanceof Customer c) {
            Integer cNo = c.getCustomerNo();
            if (cNo != null) return cNo;
        }

        // 2) principal이 UserDetails인 경우: username(=userId)로 조회
        if (principal instanceof UserDetails ud) {
            String userId = ud.getUsername();
            Integer cNo = repo.findCustomerNoByUserId(userId);
            if (cNo != null) return cNo;
            throw new IllegalStateException("고객번호를 찾을 수 없습니다: " + userId);
        }

        // 3) principal이 문자열인 경우: userId로 가정하고 조회
        if (principal instanceof String s && !s.isBlank()) {
            Integer cNo = repo.findCustomerNoByUserId(s);
            if (cNo != null) return cNo;
            throw new IllegalStateException("고객번호를 찾을 수 없습니다: " + s);
        }

        // 4) 마지막 방어
        throw new IllegalStateException("로그인 사용자의 고객번호(c_no)를 식별할 수 없습니다.");
    }

    public List<SavingItemDto> mySavings() {
        Integer cNo = currentCustomerNo();
        return repo.findMySavings(cNo).stream().map(this::toSavingDto).toList();
    }

    public List<DepositItemDto> myDeposits() {
        Integer cNo = currentCustomerNo();
        return repo.findMyDeposits(cNo).stream().map(this::toDepositDto).toList();
    }

    public List<LoanItemDto> myLoans() {
        Integer cNo = currentCustomerNo();
        return repo.findMyLoans(cNo).stream().map(this::toLoanDto).toList();
    }

    /* ---------- 매핑 유틸(문자열/BigDecimal/Long 모두 안전) ---------- */
    private static Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return new java.math.BigDecimal(o.toString().trim()).intValue(); }
        catch (Exception ignore) { return null; }
    }

    private SavingItemDto toSavingDto(Map<String, Object> m) {
        return new SavingItemDto(
                Objects.toString(m.get("id"), null),
                Objects.toString(m.get("productName"), null),
                asInt(m.get("totalInstallments")),
                asInt(m.get("paidInstallments")),
                asInt(m.get("monthlyAmount")),
                Objects.toString(m.get("nextDueDate"), null)
        );
    }

    private DepositItemDto toDepositDto(Map<String, Object> m) {
        return new DepositItemDto(
                Objects.toString(m.get("id"), null),
                Objects.toString(m.get("productName"), null),
                asInt(m.get("balance")),
                asInt(m.get("goalAmount")),
                Objects.toString(m.get("openedAt"), null),
                Objects.toString(m.get("maturityAt"), null)
        );
    }

    private LoanItemDto toLoanDto(Map<String, Object> m) {
        return new LoanItemDto(
                Objects.toString(m.get("id"), null),
                Objects.toString(m.get("productName"), null),
                m.get("balance") == null ? null : new BigDecimal(String.valueOf(m.get("balance"))),
                m.get("rate") == null ? null : new BigDecimal(String.valueOf(m.get("rate"))),
                Objects.toString(m.get("openedAt"), null),
                Objects.toString(m.get("maturityAt"), null)
        );
    }
}
