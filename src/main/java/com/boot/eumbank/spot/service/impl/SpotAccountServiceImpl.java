package com.boot.eumbank.spot.service.impl;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.spot.repository.SpotAccountQueryDSLRepository;
import com.boot.eumbank.spot.service.SpotAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpotAccountServiceImpl implements SpotAccountService {

    private final SpotAccountQueryDSLRepository spotAccountQueryDSLRepository;

    /**
     * 계좌 저장을 위해서 고객의 아이디 가져오기
     */
    @Override
    public com.boot.eumbank.account.open.dto.account.CustomerDTO getAccount(Map<String, Object> map) {
        // TODO: 구현 필요 - 새로운 계좌 서비스 사용
        // String nameFromId = (String) map.get("nameFromId");
        // String rrn6FromId = (String) map.get("rrn6FromId");
        // return accountService.getCustomerById(nameFromId, rrn6FromId);
        throw new UnsupportedOperationException("Not yet implemented");
    }
    
    /**
     * 고객번호로 계좌 목록 조회
     */
    @Override
    public List<Account> getAccountsByCustomerNo(Integer customerNo) {
        return spotAccountQueryDSLRepository.getAccountsByCustomerNo(customerNo);
    }
    
    /**
     * 고객번호로 활성 계좌 조회
     */
    @Override
    public Optional<Account> getActiveAccountByCustomerNo(Integer customerNo) {
        return spotAccountQueryDSLRepository.getActiveAccountByCustomerNo(customerNo);
    }
    
    /**
     * 고객번호로 활성 입출금 계좌 목록 조회
     */
    @Override
    public List<Account> getActiveDepositAccountsByCustomerNo(Integer customerNo) {
        return spotAccountQueryDSLRepository.getActiveDepositAccountsByCustomerNo(customerNo);
    }
    
    /**
     * 계좌 번호로 계좌 조회
     */
    @Override
    public Optional<Account> getAccountByAccountNo(Integer accountNo) {
        return spotAccountQueryDSLRepository.getAccountByAccountNo(accountNo);
    }
    
    /**
     * 계좌 잔액 확인
     */
    @Override
    public boolean checkAccountBalance(Integer customerNo, BigDecimal requiredAmount) {
        Optional<Account> accountOpt = getActiveAccountByCustomerNo(customerNo);
        if (accountOpt.isEmpty()) {
            return false;
        }
        
        Account account = accountOpt.get();
        return account.getBalance().compareTo(requiredAmount) >= 0;
    }
    
    /**
     * 계좌 잔액 업데이트
     */
    @Override
    @Transactional
    public void updateAccountBalance(Integer customerNo, BigDecimal amount) {
        Optional<Account> accountOpt = getActiveAccountByCustomerNo(customerNo);
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("고객 " + customerNo + "의 활성 계좌가 없습니다.");
        }
        
        Account account = accountOpt.get();
        BigDecimal newBalance = account.getBalance().add(amount);
        
        // 잔액이 음수가 되는 것을 방지
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("계좌 잔액이 부족합니다. 현재: " + account.getBalance() + ", 차감: " + amount);
        }
        
        spotAccountQueryDSLRepository.updateAccountBalance(account.getANo(), newBalance);
    }
    
    /**
     * 계좌 잔액 업데이트 (계좌 번호 지정)
     */
    @Override
    @Transactional
    public void updateAccountBalanceByAccountNo(Integer accountNo, BigDecimal amount) {
        Optional<Account> accountOpt = getAccountByAccountNo(accountNo);
        if (accountOpt.isEmpty()) {
            throw new RuntimeException("계좌를 찾을 수 없습니다: accountNo=" + accountNo);
        }
        
        Account account = accountOpt.get();
        BigDecimal newBalance = account.getBalance().add(amount);
        
        // 잔액이 음수가 되는 것을 방지
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("계좌 잔액이 부족합니다. 현재: " + account.getBalance() + ", 차감: " + amount);
        }
        
        spotAccountQueryDSLRepository.updateAccountBalance(accountNo, newBalance);
    }
}
