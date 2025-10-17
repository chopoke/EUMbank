package com.boot.eumbank.transfer_domain.account.service;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.transfer_domain.account.entity.AccountLimit;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountLimitRepository;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountRepository;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.transfer_domain.customer.repository.Transfer_CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 계좌 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AccountService {

    private final Transfer_AccountRepository accountRepository;
    private final Transfer_AccountLimitRepository accountLimitRepository;
    private final Transfer_CustomerRepository customerRepository;

    /**
     * 계좌 ID로 계좌 조회
     */
    public Optional<Account> findAccountById(String accountId) {
        return accountRepository.findActiveAccountByAccountId(accountId);
    }

    /**
     * 계좌번호로 계좌 조회
     */
    public Optional<Account> findAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNo(accountNumber);
    }

    /**
     * 고객의 활성 계좌 목록 조회
     */
    public List<Account> findActiveAccountsByCustomerId(String customerId) {
        Integer customerNo = Integer.parseInt(customerId);
        return accountRepository.findActiveAccountsByCustomerId(customerNo);
    }

    /**
     * 고객 ID로 계좌 목록 조회 (TransferController에서 사용)
     */
    public List<Account> getAccountsByCustomerId(String customerId) {
        Integer customerNo = Integer.parseInt(customerId);
        return accountRepository.findByCNo(customerNo);
    }

    /**
     * 계좌 잔액 조회
     */
    public BigDecimal getAccountBalance(String accountId) {
        return accountRepository.findActiveAccountByAccountId(accountId)
                .map(Account::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * 계좌 한도 조회
     */
    public Optional<AccountLimit> getAccountLimit(String accountId) {
        return accountLimitRepository.findByAccountNo(Integer.parseInt(accountId));
    }

    /**
     * 이체 가능 여부 확인
     */
    public boolean canTransfer(String accountId, BigDecimal amount) {
        Optional<Account> accountOpt = accountRepository.findActiveAccountByAccountId(accountId);
        if (accountOpt.isEmpty()) {
            return false;
        }

        Account account = accountOpt.get();
        
        // 잔액 확인
        if (!account.hasSufficientBalance(amount)) {
            return false;
        }

        // 한도 확인
        Optional<AccountLimit> limitOpt = accountLimitRepository.findByAccountNo(Integer.parseInt(accountId));
        if (limitOpt.isPresent()) {
            AccountLimit limit = limitOpt.get();
            return limit.isWithinPerTransferLimit(amount);
        }

        return true;
    }

    /**
     * 계좌 잔액 조회 메서드 - 계좌 번호로 잔액 반환
     * @param accountNo 계좌 번호
     * @return 계좌 잔액
     */
    public BigDecimal getAccountBalance(Long accountNo) {
        Account account = accountRepository.findById(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountNo));
        
        log.info("계좌 잔액 조회 - 계좌번호: {}, 잔액: {}", accountNo, account.getBalance());
        return account.getBalance();
    }

    /**
     * 계좌 입금
     */
    @Transactional
    public void deposit(String accountId, BigDecimal amount) {
        Account account = accountRepository.findActiveAccountByAccountId(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
        
        account.deposit(amount);
        log.info("계좌 입금 완료 - 계좌ID: {}, 금액: {}", accountId, amount);
    }

    /**
     * 계좌 출금
     */
    @Transactional
    public void withdraw(String accountId, BigDecimal amount) {
        Account account = accountRepository.findActiveAccountByAccountId(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
        
        if (!canTransfer(accountId, amount)) {
            throw new IllegalArgumentException("이체할 수 없습니다. 잔액이나 한도를 확인해주세요.");
        }
        
        account.withdraw(amount);
        log.info("계좌 출금 완료 - 계좌ID: {}, 금액: {}", accountId, amount);
    }

    /**
     * 계좌 닉네임 변경
     */
    @Transactional
    public void updateNickname(String accountId, String nickname) {
        Account account = accountRepository.findActiveAccountByAccountId(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
        
        account.updateNickname(nickname);
        log.info("계좌 닉네임 변경 완료 - 계좌ID: {}, 닉네임: {}", accountId, nickname);
    }

    /**
     * 계좌 한도 변경
     */
    @Transactional
    public void updateAccountLimit(String accountId, BigDecimal perTransferLimit, 
                                  BigDecimal dailyTransferLimit, BigDecimal monthlyTransferLimit,
                                  BigDecimal overdraftLimit) {
        AccountLimit limit = accountLimitRepository.findByAccountNo(Integer.parseInt(accountId))
                .orElseThrow(() -> new IllegalArgumentException("계좌 한도 정보를 찾을 수 없습니다: " + accountId));
        
        limit.updateLimits(perTransferLimit, dailyTransferLimit, monthlyTransferLimit, overdraftLimit);
        log.info("계좌 한도 변경 완료 - 계좌ID: {}", accountId);
    }

    /**
     * 최근 사용 계좌 조회
     */
    public List<Account> findRecentlyUsedAccounts(String customerId) {
        Integer customerNo = Integer.parseInt(customerId);
        return accountRepository.findRecentlyUsedAccountsByCustomerId(customerNo);
    }

    /**
     * 잔액 기준 상위 계좌 조회
     */
    public List<Account> findAccountsByBalanceDesc(String customerId) {
        Integer customerNo = Integer.parseInt(customerId);
        return accountRepository.findAccountsByBalanceDesc(customerNo);
    }

    /**
     * 계좌 개설
     */
    @Transactional
    public Account createAccount(Account account) {
        // 계좌번호 중복 확인
        if (accountRepository.existsByAccountNo(account.getAccountNo())) {
            throw new IllegalArgumentException("이미 존재하는 계좌번호입니다.");
        }

        Account savedAccount = accountRepository.save(account);
        log.info("계좌 개설 완료 - 계좌ID: {}, 계좌번호: {}", savedAccount.getAId(), savedAccount.getAccountNo());
        return savedAccount;
    }

    /**
     * 계좌 해지
     */
    @Transactional
    public void closeAccount(String accountId) {
        Account account = accountRepository.findActiveAccountByAccountId(accountId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다: " + accountId));
        
        account.closeAccount();
        log.info("계좌 해지 완료 - 계좌ID: {}", accountId);
    }

    /**
     * 계좌로부터 실제 고객 이름 조회
     * @param account 계좌 정보
     * @return 고객 이름 (한글명)
     */
    public String getCustomerNameByAccount(Account account) {
        try {
            log.debug("=== 고객 이름 조회 시작 ===");
            log.debug("계좌 번호: {}", account.getAccountNo());
            log.debug("고객 번호 (c_no from ACCOUNT_TBL): {}", account.getCNo());
            
            // ACCOUNT_TBL의 c_no로 CUSTOMER_TBL 조회
            Integer customerNo = account.getCNo();
            log.debug("고객 번호 (c_no): {}", customerNo);
            
            // 고객 번호(c_no)로 고객 정보 조회
            Customer customer = customerRepository.findByCustomerNo(Long.valueOf(customerNo))
                    .orElse(null);
            
            log.debug("조회된 고객 정보: {}", customer);
            
            if (customer != null) {
                log.debug("고객 이름 정보 - 한글명: '{}', 영문명: '{}'", 
                        customer.getCNameKr(), customer.getCNameEn());
                
                // 한글 이름이 있으면 한글 이름 반환, 없으면 영문 이름 반환
                if (customer.getCNameKr() != null && !customer.getCNameKr().trim().isEmpty()) {
                    log.debug("한글 이름 반환: {}", customer.getCNameKr());
                    return customer.getCNameKr();
                } else if (customer.getCNameEn() != null && !customer.getCNameEn().trim().isEmpty()) {
                    log.debug("영문 이름 반환: {}", customer.getCNameEn());
                    return customer.getCNameEn();
                }
            }
            
            // 고객 정보를 찾을 수 없는 경우 기본값 반환
            log.debug("고객 정보를 찾을 수 없음 - 기본값 반환");
            return "이음은행 고객";
            
        } catch (Exception e) {
            log.error("고객 이름 조회 중 오류 발생 - 계좌: {}, 고객번호: {}", 
                    account.getAccountNo(), account.getCNo(), e);
            return "이음은행 고객";
        }
    }
}
