package com.boot.eumbank.foreign.service;


import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.foreign.entity.ForeignProduct;
import com.boot.eumbank.foreign.dto.FxOpenReqDto;
import com.boot.eumbank.foreign.dto.FxOpenRespDto;
import com.boot.eumbank.foreign.repo.ForeignProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class FxOpenService {

    private final ForeignProductRepository productRepo;
    // private final AccountRepository accountRepo;

    @Transactional
    public FxOpenRespDto openFxAccount(FxOpenReqDto req) {
        // 1) 필수동의 체크
        if (!"Y".equalsIgnoreCase(req.getAgreeTerms()) || !"Y".equalsIgnoreCase(req.getAgreePrivacy())) {
            throw new IllegalArgumentException("필수 약관 동의 필요");
        }

        // 2) 외화상품 확인
        ForeignProduct product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 3) 계좌번호/ID 생성
        String newAccNo = generateAccountNo(req.getCurrency());
        String newAccId = "FX" + System.currentTimeMillis();

        // 4) 계좌 생성
        Account acc = new Account();
        acc.setAId(newAccId);
        acc.setCNo(req.getCustomerId());
        acc.setAccountNo(newAccNo);
        acc.setProductCode(String.valueOf(product.getId()));
        acc.setAccountType("FX_DEPOSIT");
        acc.setOpenedAt(LocalDateTime.now());
        acc.setAccountPwd("0000"); // 데모: 고정값(실서비스는 암호화/입력 받기)
        acc.setStatus("ACTIVE");
        acc.setBalance(BigDecimal.ZERO);
        acc.setCurrency(req.getCurrency());
        acc.setAgreeTerms("Y");
        acc.setAgreePrivacy("Y");
        acc.setAgreeMarketing(req.getAgreeMarketing());
        if (product.getApy() != null) {
            acc.setRate(product.getApy());
        }

        // accountRepo.save(acc);

        return new FxOpenRespDto(
                acc.getAccountNo(),
                acc.getCurrency(),
                acc.getProductCode(),
                acc.getAccountType(),
                acc.getOpenedAt()
        );

    }

    /** 통화코드 + 시간/난수 조합으로 간단 계좌번호 생성 (임시, 중복검사 없음) */
    private String generateAccountNo(String currency) {
        Random r = new Random();
        long ts = System.currentTimeMillis() % 100000;   // 5자리
        int rand = 100000 + r.nextInt(900000);           // 6자리
        return currency + "-" + ts + rand;               // 예: USD-1234567890
    }
}
