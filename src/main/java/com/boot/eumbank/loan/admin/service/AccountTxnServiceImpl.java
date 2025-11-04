package com.boot.eumbank.loan.admin.service;


import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 입금로직 서비스
 */
@Service @Slf4j @RequiredArgsConstructor
public class AccountTxnServiceImpl {

    private final AccountSelectRepository accountRepository;      // 계좌 저장


    @Transactional
    public void deposit (Integer accountNo, BigDecimal amount, LocalDateTime at, String memo){

        // 먼저 확인
        if(accountNo == null) throw new IllegalArgumentException("계좌번호가 없습니다.");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("입금 금액이 0 이하입니다.");

        // 1. 계좌 잠금죄회
        var account = accountRepository.findByIdForUpdate(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. a_no=" + accountNo));

        // 2 타입변경 (대출금 수령계좌를 대출타입으로 변경)
        if (!"LOAN".equals(account.getAccountType())) account.setAccountType("LOAN");

        // 3. 잔액 갱신
        var before = account.getBalance();
        var after = before.add(amount);
        account.setBalance(after);


        // 4) 원장 기록
        // var txn = new AccountTxn(...);
        // txn.setANo(accountNo);
        // txn.setAmount(amount);
        // txn.setType("CREDIT");
        // txn.setBalanceAfter(after);
        // txn.setMemo(memo);
        // txn.setCreatedAt(at != null ? at : LocalDateTime.now());
        // txnRepository.save(txn);

        log.info("[대출계좌추가완료] a_no={}, +{}, balance {} -> {}, memo={}", accountNo, amount, before, after, memo);  
    }

}
