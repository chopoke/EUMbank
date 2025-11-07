// src/main/java/com/boot/eumbank/mypage/service/MypageProductService.java
package com.boot.eumbank.mypage.service;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.mypage.dto.DepositItemDto;
import com.boot.eumbank.mypage.dto.LoanItemDto;
import com.boot.eumbank.mypage.dto.SavingItemDto;
import com.boot.eumbank.mypage.repository.MypageProductRepository;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MypageProductService {

    private final MypageProductRepository repo;

    // ✅ 납입 회차 계산용(히스토리에서 SAVING_PAY 건수 카운트)
    private final TransferHistoryRepository thRepo;

    /** (컨트롤러에서 호출) c_no 해석: ?cno > Principal.name(userId) > SecurityContext */
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

    /** SecurityContext에서 c_no 추출(마지막 방어) */
    private Integer currentCustomerNo() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return null;
            Object p = auth.getPrincipal();

            if (p instanceof Customer c && c.getCustomerNo() != null) {
                return c.getCustomerNo();
            }
            if (p instanceof UserDetails ud) {
                return repo.findCustomerNoByUserId(ud.getUsername());
            }
            if (p instanceof String s && !s.isBlank()) {
                return repo.findCustomerNoByUserId(s);
            }
        } catch (Exception ignore) {}
        return null;
    }

    /* =========================================================
       적금/예금/대출 조회
       - 적금은 paidInstallments 를 히스토리(SAVING_PAY) 기반으로 재계산
       ========================================================= */
    public List<SavingItemDto> mySavings(int cNo) {
        return repo.findMySavings(cNo).stream()
                .map(this::toSavingDtoWithHistory)   // ✅ 납입회차를 히스토리로부터 보정
                .toList();
    }

    public List<DepositItemDto> myDeposits(int cNo) {
        return repo.findMyDeposits(cNo).stream().map(this::toDepositDto).toList();
    }

    public List<LoanItemDto> myLoans(int cNo) {
        return repo.findMyLoans(cNo).stream().map(this::toLoanDto).toList();
    }

    /* ---------- 매핑 유틸 ---------- */

    private static Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return new BigDecimal(o.toString().trim()).intValue(); }
        catch (Exception ignore) { return null; }
    }

    /** 다양한 키 후보 중에서 계좌번호(a_no)를 찾아낸다. */
    private Integer pickAccountNo(Map<String, Object> m) {
        // 리포지토리에서 어떤 키로 넘어와도 잡히게 넓게 커버
        Integer aNo = asInt(m.get("a_no"));
        if (aNo == null) aNo = asInt(m.get("aNo"));
        if (aNo == null) aNo = asInt(m.get("accountNo"));
        if (aNo == null) aNo = asInt(m.get("i_account_no")); // 혹시 적금쪽에서 이렇게 줄 수도
        return aNo;
    }

    /** ✅ SAVING_PAY 카운트로 paidInstallments 보정 */
    private SavingItemDto toSavingDtoWithHistory(Map<String, Object> m) {
        String id            = Objects.toString(m.get("id"), null);
        String productName   = Objects.toString(m.get("productName"), null);
        Integer totalRounds  = asInt(m.get("totalInstallments")); // 계약 회차(i_month)
        Integer monthlyAmt   = asInt(m.get("monthlyAmount"));
        String nextDueDate   = Objects.toString(m.get("nextDueDate"), null);

        // 1) 기본값: DB에서 이미 계산된 paidInstallments 가 있으면 사용
        Integer paidFromDb   = asInt(m.get("paidInstallments"));

        // 2) 히스토리 기반으로 다시 계산 (가능하면 이 값을 우선 사용)
        Integer aNo = pickAccountNo(m);
        Integer paidFromHistory = null;
        if (aNo != null) {
            try {
                long cnt = thRepo.countByAccountNoAndTransactionType(aNo, "SAVING_PAY");
                paidFromHistory = (int) cnt;
            } catch (Exception e) {
                log.warn("[mypage] SAVING_PAY count 실패 aNo={}", aNo, e);
            }
        }

        int finalPaid = (paidFromHistory != null) ? paidFromHistory
                : (paidFromDb != null ? paidFromDb : 0);

        return new SavingItemDto(
                id,
                productName,
                totalRounds,
                finalPaid,
                monthlyAmt,
                nextDueDate
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
