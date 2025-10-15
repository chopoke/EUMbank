// src/main/java/com/boot/eumbank/foreign/service/FxOpenService.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.account.Open.dto.AccountDTO;
import com.boot.eumbank.account.Open.repository.AccountRepo;
import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class FxOpenService {

    private final AccountRepo accountRepo;

    @Transactional
    public FxOpenRespDto openUsdAccount(FxOpenReqDto req) {
        // 1) 검증
        if (req.getCustomerNo() == null)
            throw new IllegalArgumentException("고객번호(c_no) 필요");
        if (req.getPin() == null || req.getPin().length() < 4)
            throw new IllegalArgumentException("계좌 비밀번호 4자리 이상 필요");
        if (!"Y".equalsIgnoreCase(req.getAgreeTerms()) ||
                !"Y".equalsIgnoreCase(req.getAgreePrivacy()))
            throw new IllegalArgumentException("필수 약관 동의 필요");

        // 2) 통화(USD 고정)
        String currency = (req.getCurrency() == null || req.getCurrency().isBlank())
                ? "USD" : req.getCurrency().toUpperCase();
        if (!"USD".equals(currency))
            throw new IllegalArgumentException("현재는 USD 계좌만 개설 가능합니다.");

        // 3) 고유값 생성 + 중복체크
        String aId = genAId();
        while (accountRepo.existsByAId(aId)) aId = genAId();

        String acctNo = genDisplayAccountNo();
        while (accountRepo.existsByAccountNo(acctNo)) acctNo = genDisplayAccountNo();

        // 4) 엔티티 생성
        Account entity = Account.builder()
                .aId(aId)
                .cNo(req.getCustomerNo().intValue())
                .accountNo(acctNo)
                .appId(1)
                .productCode("FX_USD_001")
                .accountType("FX")
                .openedAt(LocalDateTime.now())
                .accountPwd(req.getPin())
                .status("ACTIVE")
                .balance(BigDecimal.ZERO)
                .currency("USD")
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

    private String genAId() {
        long n = System.currentTimeMillis() % 1_000_000_000L;
        return "A" + n;
    }

    private String genDisplayAccountNo() {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        return String.format("%04d-%04d-%04d",
                r.nextInt(0, 10000),
                r.nextInt(0, 10000),
                r.nextInt(0, 10000));
    }
}