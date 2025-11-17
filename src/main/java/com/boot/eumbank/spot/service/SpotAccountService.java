package com.boot.eumbank.spot.service;

import com.boot.eumbank.account.open.entity.account.Account;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface SpotAccountService {

    /**
     * 계좌 저장을 위해서 고객의 아이디 가져오기
     */
    public com.boot.eumbank.account.open.dto.account.CustomerDTO getAccount(java.util.Map<String, Object> map);
    
    /**
     * 고객번호로 계좌 목록 조회
     */
    List<Account> getAccountsByCustomerNo(Integer customerNo);
    
    /**
     * 고객번호로 활성 계좌 조회
     */
    Optional<Account> getActiveAccountByCustomerNo(Integer customerNo);
    
    /**
     * 고객번호로 활성 입출금 계좌 목록 조회
     */
    List<Account> getActiveDepositAccountsByCustomerNo(Integer customerNo);
    
    /**
     * 계좌 번호로 계좌 조회
     */
    Optional<Account> getAccountByAccountNo(Integer accountNo);
    
    /**
     * 계좌 잔액 확인
     */
    boolean checkAccountBalance(Integer customerNo, BigDecimal requiredAmount);
    
    /**
     * 계좌 잔액 업데이트
     */
    void updateAccountBalance(Integer customerNo, BigDecimal amount);
    
    /**
     * 계좌 잔액 업데이트 (계좌 번호 지정)
     */
    void updateAccountBalanceByAccountNo(Integer accountNo, BigDecimal amount);
}

