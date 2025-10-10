package com.boot.eumbank.repository.custom;

import com.boot.eumbank.dto.CustomerDTO;

import java.util.Map;

public interface AccountCustom {

    void registerAccount(CustomerDTO dto, Map<String, Object> saveInfo);

}
