package com.boot.eumbank.account.Open.service.Impl;

import com.boot.eumbank.account.Open.dto.CustomerDTO;
import com.boot.eumbank.account.Open.repository.custom.Custom;
import com.boot.eumbank.account.Open.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {
    private final Custom custom;   // QueryDSL 구현체: CustomRepositoryImpl

    @Override
    public CustomerDTO getAccount(Map<String, Object> map) {
        return custom.getAccount(map);
    }
}
