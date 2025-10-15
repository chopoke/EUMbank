package com.boot.eumbank.account.open.service;

import com.boot.eumbank.account.open.dto.CustomerDTO;

import java.util.Map;

public interface AccountCustom {

    void registerAccount(CustomerDTO dto, Map<String, Object> saveInfo);

}
