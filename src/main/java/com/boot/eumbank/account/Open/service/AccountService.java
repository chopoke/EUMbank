package com.boot.eumbank.account.Open.service;

import com.boot.eumbank.account.Open.dto.CustomerDTO;

import java.util.Map;

public interface AccountService {

    /**
     *  계좌 저장을 위해서 고객의 아이디 가져오기
     */
    public CustomerDTO getAccount(Map<String, Object> map);
}