// src/main/java/com/boot/eumbank/foreign/service/FxOpenService.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.account.Open.repository.AccountRepo;
import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class FxOpenService {

    private final AccountRepo accountRepo;

    @Transactional
    public FxOpenRespDto openUsdAccount(FxOpenReqDto req) {
        // 1) 기본 검증
        if (req.getCustomerNo() == null)
            throw new IllegalArgumentException("고객번호(c_no) 필요");

        if (req.getPin() == null || req.getPin().length() < 4)
            throw new IllegalArgumentException("계좌 비밀번호 4자리 이상 필요");

        if (req.getPinNumber() == null)
            throw new IllegalArgumentException("거래 PIN 4자리 이상 필요");

        if (!"Y".equalsIgnoreCase(req.getAgreeTerms()) ||
                !"Y".equalsIgnoreCase(req.getAgreePrivacy()))
            throw new IllegalArgumentException("필수 약관 동의 필요");

        // 2) 통화 정규화 (DB에는 3자리 코드만 저장: USD, EUR, JPY ...)
        //    예: "JPY(100)" → "JPY"
        String currency = normalizeCurrency(req.getCurrency());

        // 3) 고유값 생성 + 중복체크
        String aId = genAId();
        while (accountRepo.existsByAId(aId)) {
            aId = genAId();
        }

        String acctNo = genDisplayAccountNo();
        while (accountRepo.existsByAccountNo(acctNo)) {
            acctNo = genDisplayAccountNo();
        }

        // 3-1) 외화 상품코드(F + 5자리 숫자) 생성 + 중복회피
        String fxProductCode = genFxProductCode();

        // 4) 엔티티 생성
        Account entity = Account.builder()
                .aId(aId)
                .cNo(req.getCustomerNo().intValue())
                .accountNo(acctNo)
                .appId(1)
                .productCode(fxProductCode)         // 예: F12345
                .accountType("외환")
                .openedAt(LocalDateTime.now())
                .accountPwd(req.getPin())
                .pinNumber(req.getPinNumber())
                .status("ACTIVE")
                .balance(BigDecimal.ZERO)
                .currency(currency)                  // 예: "JPY"
                .nickname(req.getNickname())
                .createdBy("SYSTEM")
                .updatedAt(LocalDateTime.now())
                .agreeTerms("Y")
                .agreePrivacy("Y")
                .agreeMarketing(req.getAgreeMarketing())
                .rate(BigDecimal.ZERO)
                .build();

        // 5) 저장
        Account saved = accountRepo.save(entity);

        // 6) 응답
        return new FxOpenRespDto(
                saved.getAccountNo(),
                saved.getCurrency(),
                saved.getProductCode(),
                saved.getAccountType(),
                saved.getOpenedAt()
        );
    }

    /** AID 생성 (간단한 타임스탬프 기반) */
    private String genAId() {
        long n = System.currentTimeMillis() % 1_000_000_000L;
        return "A" + n;
    }

    /** 화면용 계좌번호(#####-####-####) */
    private String genDisplayAccountNo() {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        return String.format("%04d-%04d-%04d",
                r.nextInt(0, 10000),
                r.nextInt(0, 10000),
                r.nextInt(0, 10000));
    }

    /** 상품코드 : F + 5자리 숫자 (00000~99999), 중복 회피 */
    private String genFxProductCode() {
        String code;
        do {
            int n = ThreadLocalRandom.current().nextInt(100_000); // 0 ~ 99999
            code = "F" + String.format("%05d", n);
        } while (accountRepo.existsByProductCode(code));
        return code;
    }

    /** 통화 문자열 정규화: "JPY(100)" → "JPY", null/공백 → "USD" */
    private String normalizeCurrency(String raw) {
        if (raw == null || raw.isBlank()) return "USD";
        String s = raw.trim().toUpperCase();

        // 괄호 이후 제거
        int idx = s.indexOf('(');
        if (idx >= 0) s = s.substring(0, idx);

        // 알파벳만 남기기
        s = s.replaceAll("[^A-Z]", "");

        // 길이 제한(3자리)
        if (s.length() > 3) s = s.substring(0, 3);
        if (s.isEmpty()) s = "USD";
        return s;
    }

    /** 프런트에서 고객번호만 필요할 때 쓰는 헬퍼 */
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
        return map;
    }
}
