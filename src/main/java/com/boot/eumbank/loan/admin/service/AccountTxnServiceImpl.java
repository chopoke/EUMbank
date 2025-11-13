package com.boot.eumbank.loan.admin.service;


import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 입금로직 서비스
 */
@Service @Slf4j @RequiredArgsConstructor
public class AccountTxnServiceImpl {

    private final AccountSelectRepository accountRepository;      // 계좌 저장
    private final TransferHistoryRepository historyRepository;

    private static final String ACC_TYPE_DDA = "입출금";
    private static final String PCODE_REPAY  = "상환";

    @Transactional
    public void deposit(Integer accountNo, BigDecimal amount, LocalDateTime at, String memo){
        String transferId = "TX-" + UUID.randomUUID().toString().substring(0,8).toUpperCase();
        deposit(accountNo, amount, at, memo, transferId, "LOAN_FUNDING", "DEPOSIT", "EUMBANK", null);
    }       //내부용 위임

    // 거래내역 추가
    @Transactional
    public void deposit(
            Integer accountNo,
            BigDecimal amount,
            LocalDateTime at,
            String memo,
            String transferId,
            String transactionType,   // 예: "LOAN_FUNDING"
            String transferType,      // 예: "DEPOSIT"
            String otherBank,
            String otherAccount) {
        if (accountNo == null) throw new IllegalArgumentException("계좌번호가 없습니다.");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("입금 금액이 0 이하입니다.");

        // 1. 계좌 잠금죄회
        var account = accountRepository.findByIdForUpdate(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. a_no=" + accountNo));


        // 2. 잔액 갱신
        var before = account.getBalance();
        var after = before.add(amount);
        account.setBalance(after);

        // 3) 거래이력 INSERT
        var th = TransferHistory.builder()
                .transferId(trimTo20(transferId))
                .accountNo(accountNo)
                .amount(amount)
                .memo(memo)
                .otherBank(otherBank)
                .otherAccount(otherAccount)
                .transferType(transferType != null ? transferType : "DEPOSIT")      // "DEPOSIT"
                .afterBalance(after)
                .transactionType(transactionType != null ? transactionType : "LOAN_FUNDING")
                .accountOut(null)
                .accountIn(amount)
                .build();

        th.setTransferAt(at != null ? at : LocalDateTime.now());

        log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        log.info("[입금] a_no={}, +{}, balance {} -> {}, memo={}, txId={}",
                accountNo, amount, before, after, memo, transferId);

        historyRepository.save(th);
    }

    private static String trimTo20(String s){
        if (s == null) return "TX-" + System.currentTimeMillis();
        return s.length() <= 20 ? s : s.substring(0, 20);
    }


    // =================================================
    // 상환
    @Transactional
    public void withdraw(
            Integer accountNo,
            BigDecimal amount,
            LocalDateTime at,
            String memo,
            String transferId,
            String transactionType,   // 예: "LOAN_REPAYMENT"
            String transferType,      // 예: "WITHDRAWAL"
            String otherBank,
            String otherAccount) {

        if (accountNo == null) throw new IllegalArgumentException("계좌번호가 없습니다.");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("출금 금액이 0 이하입니다.");

        // 1) 계좌 잠금 조회
        var account = accountRepository.findByIdForUpdate(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. a_no=" + accountNo));

//        // 상환계좌의 a_product_code를 대출로 변경
//        try {
//            String accType = account.getAccountType();   // a_account_type
//            String prod    = account.getProductCode();   // a_product_code
//            if ("입출금".equals(accType) && (prod == null || !"상환".equals(prod))) {
//                account.setProductCode("상환");
//            }
//        } catch (Exception ignore) { /* 엔티티 필드명 차이시 무해 */ }

        // 2) 잔액 체크
        var before = account.getBalance();
        if (before.compareTo(amount) < 0) {
            throw new IllegalStateException("잔액 부족: 필요=" + amount + ", 보유=" + before);
        }

        // 3) 잔액 갱신
        var after = before.subtract(amount);
        account.setBalance(after);

        // 4) 거래이력 INSERT
        var th = TransferHistory.builder()
                .transferId(trimTo20(transferId))
                .accountNo(accountNo)
                .amount(amount)
                .memo(memo)
                .otherBank(otherBank)
                .otherAccount(otherAccount)
                .transferType(transferType != null ? transferType : "WITHDRAWAL")
                .afterBalance(after)
                .transactionType(transactionType != null ? transactionType : "LOAN_REPAYMENT")
                .accountOut(amount)
                .accountIn(null)
                .build();
        th.setTransferAt(at != null ? at : LocalDateTime.now());

        historyRepository.save(th);

        log.info("[출금] a_no={}, -{}, balance {} -> {}, memo={}, txId={}",
                accountNo, amount, before, after, memo, transferId);
    }

    @Transactional
    public void markAsRepaymentAccount(Integer accountNo) {
        if (accountNo == null) throw new IllegalArgumentException("계좌번호가 없습니다.");

        var account = accountRepository.findByIdForUpdate(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다. a_no=" + accountNo));

        try {
            String accType = account.getAccountType(); // a_account_type
            String prod    = account.getProductCode(); // a_product_code
            if (ACC_TYPE_DDA.equals(accType) && !PCODE_REPAY.equals(prod)) {
                account.setProductCode(PCODE_REPAY);
            }
        } catch (Exception e) {
            log.warn("상환계좌 태깅 실패(무시 가능): a_no={}, err={}", accountNo, e.toString());
        }
    }

}
