package com.boot.eumbank.accountCreate.repository.custom;

import com.boot.eumbank.accountCreate.dto.CustomerDTO;

import java.util.Map;

public interface AccountCustom {

    void registerAccount(CustomerDTO dto, Map<String, Object> saveInfo);

}
