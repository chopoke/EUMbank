package com.boot.eumbank.accountCreate.service.account.Impl;

import com.boot.eumbank.accountCreate.dto.CustomerDTO;
import com.boot.eumbank.accountCreate.mapper.AccountMapper;
import com.boot.eumbank.accountCreate.service.account.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountMapper accountMapper;

    /**
     *
     * FK 값을 가져오기 위함
     * @param map
     * @return
     */
    @Override
    public CustomerDTO getAccount(Map<String, Object> map) {

        Map<String, Object> product = (Map<String, Object>) map.get("verification");
        String nameFromId = product != null ? (String) product.get("nameFromId") : null;
        String rrn6FromId = product != null ? (String) product.get("rrn6FromId") : null;

        CustomerDTO dto = accountMapper.getCustomerByACustomerId(nameFromId, rrn6FromId);

        return dto;
    }
}
