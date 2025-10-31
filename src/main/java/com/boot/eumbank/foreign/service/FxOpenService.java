// src/main/java/com/boot/eumbank/foreign/service/FxOpenService.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.jpa.repository.custom.AccountRepo;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import com.boot.eumbank.foreign.entity.ForeignExchange;
import com.boot.eumbank.foreign.repo.ForeignExchangeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class FxOpenService {

    private final AccountRepo accountRepo;
    private final CustomerRepo customerRepo;
    private final ForeignExchangeRepo foreignExchangeRepo;

    /** 저장 없이 “사용 가능한 계좌번호”만 만들어서 반환 */
    @Transactional(readOnly = true)
    public String previewAccountNo(String currency) {
        String acctNo = genDisplayAccountNo();
        while (accountRepo.existsByAccountNo(acctNo)) {
            acctNo = genDisplayAccountNo();
        }
        return acctNo;
    }

    /** 외화 입출금 계좌 개설 */
    @Transactional
    public FxOpenRespDto openUsdAccount(FxOpenReqDto req) {
        // 1) 기본 검증
        if (req.getCustomerNo() == null) {
            throw new IllegalArgumentException("고객번호(c_no) 필요");
        }
        if (req.getPin() == null || !req.getPin().matches("\\d{6}")) {
            throw new IllegalArgumentException("계좌 비밀번호는 숫자 6자리여야 합니다.");
        }
        if (req.getPinNumber() == null || !String.valueOf(req.getPinNumber()).matches("\\d{6}")) {
            throw new IllegalArgumentException("거래 PIN은 숫자 6자리여야 합니다.");
        }

        // 약관을 boolean/문자 어떤 형식으로 받아도 Y/N으로 통일
        final String agreeTerms      = yn(req.getAgreeTerms());
        final String agreePrivacy    = yn(req.getAgreePrivacy());
        final String agreeRisk       = yn(req.getAgreeRisk());       // 없으면 N 처리
        final String agreeProduct    = yn(req.getAgreeProduct());    // 없으면 N 처리
        final String agreeMarketing  = yn(req.getAgreeMarketing());  // 선택값: null->N

        // 필수 검증
        if (!"Y".equals(agreeTerms) || !"Y".equals(agreePrivacy)) {
            throw new IllegalArgumentException("필수 약관 동의 필요");
        }

        // 1-1) 고객의 영문이름 최초 1회만 저장
        maybeSaveEnglishNameOnce(req.getCustomerNo(), req.getEnglishName());

        // 2) 통화 정규화 (DB에는 3자리 코드)
        String currency = normalizeCurrency(req.getCurrency());

        // 3) 고유값 생성 + 중복체크
        String aId = genAId();
        while (accountRepo.existsByAId(aId)) {
            aId = genAId();
        }

        // 3-1) 프리뷰로 제안한 계좌번호가 아직 미사용이면 채택
        String acctNo = req.getPreferredAccountNo();
        if (acctNo == null || acctNo.isBlank() || accountRepo.existsByAccountNo(acctNo)) {
            acctNo = genDisplayAccountNo();
            while (accountRepo.existsByAccountNo(acctNo)) {
                acctNo = genDisplayAccountNo();
            }
        }

        // 3-2) 외화 상품코드(F + 5자리 숫자) 생성 + 중복회피
        String fxProductCode = genFxProductCode();

        // 4) 엔티티 생성 (ACCOUNT_TBL)
        Account entity = Account.builder()
                .aId(aId)
                .cNo(req.getCustomerNo().intValue())
                .accountNo(acctNo)
                .appId(1)
                .productCode(fxProductCode)
                .accountType("외환")
                .openedAt(LocalDateTime.now())
                .accountPwd(req.getPin())
                .status("ACTIVE")
                .balance(BigDecimal.ZERO)
                .currency(currency)
                .nickname(req.getNickname())
                .createdBy("SYSTEM")
                .updatedAt(LocalDateTime.now())
                .agreeTerms(agreeTerms)
                .agreePrivacy(agreePrivacy)
                .agreeMarketing(agreeMarketing)
                .rate(BigDecimal.ZERO)
                .build();

        // 5) 저장 (ACCOUNT_TBL)
        Account saved = accountRepo.save(entity);

        // 6) 개설 이벤트를 FOREIGN_EXCHANGE_TBL에도 기록 (금액 0, OPEN 이벤트)
        ForeignExchange openEvt = ForeignExchange.builder()
                .fpNo(null)
                .cNo(saved.getCNo())
                .aNo(saved.getANo())
                .feId("OPEN-" + System.currentTimeMillis())
                .feCurCode(saved.getCurrency())
                .feAmtFc(BigDecimal.ZERO)
                .feAmtKrw(BigDecimal.ZERO)
                .feRateApplied(BigDecimal.ZERO)
                .feFee(BigDecimal.ZERO)
                .feStatus("COMPLETED")
                .feOrderedAt(LocalDateTime.now())
                .feSide("OPEN")
                .feMemo("외화계좌 개설")
                .agreeTerms(agreeTerms)
                .agreePrivacy(agreePrivacy)
                .agreeRisk(agreeRisk)
                .agreeProduct(agreeProduct)
                .agreeMarketing(agreeMarketing)
                .build();
        foreignExchangeRepo.save(openEvt);

        // 7) 응답
        return new FxOpenRespDto(
                saved.getAccountNo(),
                saved.getCurrency(),
                saved.getProductCode(),
                saved.getAccountType(),
                saved.getOpenedAt()
        );
    }

    /** 다양한 형태(boolean/String/null)의 입력을 'Y'/'N'으로 통일 */
    private String yn(Object... candidates) {
        for (Object c : candidates) {
            if (c == null) continue;
            if (c instanceof Boolean b) return b ? "Y" : "N";
            String s = c.toString().trim();
            if (s.equalsIgnoreCase("Y") || s.equalsIgnoreCase("YES") || s.equalsIgnoreCase("true"))  return "Y";
            if (s.equalsIgnoreCase("N") || s.equalsIgnoreCase("NO")  || s.equalsIgnoreCase("false")) return "N";
        }
        return "N";
    }

    /** c_name_en이 비어있을 때만 한 번 저장 */
    private void maybeSaveEnglishNameOnce(Integer cNo, String englishNameRaw) {
        if (cNo == null || englishNameRaw == null || englishNameRaw.isBlank()) return;

        Customer cust = customerRepo.findById(cNo).orElse(null);
        if (cust == null) return;

        String current = safe(cust.getCNameEn());
        if (!current.isBlank()) return; // 이미 있으면 변경하지 않음

        String normalized = normalizeEnglishName(englishNameRaw);
        if (normalized.isBlank()) return;

        cust.setCNameEn(normalized);
        cust.setCUpdatedAt(Instant.now());
        cust.setCUpdatedBy("FX-OPEN");
        customerRepo.save(cust);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Customer p && p.getCustomerNo() == cNo) {
            p.setCNameEn(normalized);
        }
    }

    private String normalizeEnglishName(String s) {
        String t = s.trim()
                .replaceAll("[^A-Za-z ]", " ")
                .replaceAll("\\s+", " ")
                .toUpperCase();
        return t.length() > 100 ? t.substring(0, 100) : t;
    }

    private String safe(String s) { return s == null ? "" : s.trim(); }

    /** AID 생성 (간단한 타임스탬프 기반) */
    private String genAId() {
        long n = System.currentTimeMillis() % 1_000_000_000L;
        return "A" + n;
    }

    /** 화면용 계좌번호(####-####-####) */
    private String genDisplayAccountNo() {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        return String.format("%04d-%04d-%04d",
                r.nextInt(0, 10000),
                r.nextInt(0, 10000),
                r.nextInt(0, 10000));
    }

    /** 상품코드 : F + 5자리 숫자, 중복 회피 */
    private String genFxProductCode() {
        String code;
        do {
            int n = ThreadLocalRandom.current().nextInt(100_000);
            code = "F" + String.format("%05d", n);
        } while (accountRepo.existsByProductCode(code));
        return code;
    }

    /** 통화 문자열 정규화: "JPY(100)" → "JPY", null/공백 → "USD" */
    private String normalizeCurrency(String raw) {
        if (raw == null || raw.isBlank()) return "USD";
        String s = raw.trim().toUpperCase();
        int idx = s.indexOf('(');
        if (idx >= 0) s = s.substring(0, idx);
        s = s.replaceAll("[^A-Z]", "");
        if (s.length() > 3) s = s.substring(0, 3);
        if (s.isEmpty()) s = "USD";
        return s;
    }

    /** 프런트에서 고객정보(번호 + 영문이름) 필요할 때 */
    @Transactional(readOnly = true)
    public Map<String, Object> getNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            throw new IllegalArgumentException("로그인이 필요합니다.");

        Customer customer = (Customer) auth.getPrincipal();
        int cno = customer.getCustomerNo();
        if (cno == 0)
            throw new IllegalStateException("고객번호를 확인할 수 없습니다.");

        Map<String, Object> map = new HashMap<>();
        map.put("c_no", cno);
        map.put("c_name_en", customer.getCNameEn());
        return map;
    }
}
