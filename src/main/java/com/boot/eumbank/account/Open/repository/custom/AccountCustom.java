package com.boot.eumbank.account.Open.repository.custom;

import com.boot.eumbank.account.Open.dto.CustomerDTO;

import java.util.Map;

public interface AccountCustom {

    void registerAccount(CustomerDTO dto, Map<String, Object> saveInfo);

}
